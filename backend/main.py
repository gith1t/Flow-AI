from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import os
import re
from datetime import datetime
from openai import OpenAI
from dotenv import load_dotenv

app = FastAPI(title="Yomirai Backend Engine")

# Завантажує змінні з .env, що лежить на рівень вище проєкту (поза репозиторієм -> не потрапить у git)
# backend/main.py -> ../../.env == C:\Users\Gitpc\OneDrive\Документы\.env
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".env"))

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ініціалізація клієнта OpenAI (зчитає ключ із середовища)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# --- PYDANTIC MODELS ---
class Evidence(BaseModel):
    id: str
    title: str
    quote: str
    source_url: Optional[str] = None

class Relation(BaseModel):
    target_id: str
    type: str

class CommitState(BaseModel):
    revision: int
    workspace: str
    updated_at: str

class Finding(BaseModel):
    id: str
    title: str
    status: str
    details: str
    commit_state: CommitState
    evidence: List[Evidence] = []
    relations: List[Relation] = []

class ResearchRequest(BaseModel):
    query: str
    text: str

class ProposedHypothesis(BaseModel):
    title: str
    details: str
    confidence_score: int

class SocraticDraft(BaseModel):
    identified_gap: str
    socratic_questions: List[str]
    proposed_hypothesis: ProposedHypothesis

# --- STATE MANAGEMENT ---
STATE_FILE = "workspace_state.json"

def load_state() -> Dict[str, Any]:
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"findings": [], "proposals": []}

def save_state(state: Dict[str, Any]):
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=4, ensure_ascii=False)

def extract_json(text: str) -> str:
    """Очищає сиру відповідь ШІ від markdown-обгорток (```json ... ```) перед json.loads."""
    if not text:
        return text
    cleaned = text.strip()
    # Знімаємо блоки ```json ... ``` або ``` ... ```
    fence = re.match(r"^```(?:json)?\s*(.*?)\s*```$", cleaned, re.DOTALL | re.IGNORECASE)
    if fence:
        cleaned = fence.group(1).strip()
    return cleaned

# --- ENDPOINTS ---
@app.get("/api/workspace")
async def get_workspace():
    return load_state()

@app.post("/api/research")
async def start_research(payload: ResearchRequest):
    state = load_state()
    
    system_prompt = (
        "You are an expert historical and mythological research AI. "
        "Your task is to analyze the provided text and extract key findings, facts, or claims "
        "relevant to the user's query. "
        "You MUST respond ONLY with a valid JSON object in this exact format:\n"
        "{\n"
        '  "proposals": [\n'
        "    {\n"
        '      "id": "prop_1",\n'
        '      "title": "Short title of the finding",\n'
        '      "status": "Unidentified",\n'
        '      "details": "Detailed explanation of the claim, context, and potential relations.",\n'
        '      "commit_state": {\n'
        '        "revision": 1,\n'
        '        "workspace": "Proposal",\n'
        '        "updated_at": "current_timestamp"\n'
        "      },\n"
        '      "evidence": [\n'
        "        {\n"
        '          "id": "ev_1",\n'
        '          "title": "Name of source text (e.g. Homer, Iliad)",\n'
        '          "quote": "EXACT quote from the user-provided text that proves this finding."\n'
        "        }\n"
        "      ],\n"
        '      "relations": []\n'
        "    }\n"
        "  ]\n"
        "}\n"
        "Strictly avoid any markdown formatting. Return raw JSON."
    )
    
    user_content = f"User Query: {payload.query}\n\nText to analyze:\n{payload.text}"
    
    try:
        print(">>> Відправляємо текст в OpenAI...")
        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ],
                response_format={"type": "json_object"}
            )
        except Exception as e:
            print(f"❌ КРИТИЧНА ПОМИЛКА OPENAI API: {e}")
            raise e
        
        raw_content = response.choices[0].message.content
        print(f">>> Отримано сиру відповідь: {raw_content[:200]}...")
        
        result_data = json.loads(extract_json(raw_content))
        new_proposals = result_data.get("proposals", [])
        
        final_proposals = []
        for idx, prop in enumerate(new_proposals):
            prop["id"] = f"prop_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{idx}"
            try:
                prop["commit_state"]["updated_at"] = datetime.utcnow().isoformat()
            except (KeyError, TypeError):
                # картка без commit_state — пропустимо на етапі валідації нижче
                pass
            
            try:
                validated_finding = Finding(**prop)
            except Exception as e:
                print(f"Помилка валідації картки: {e}")
                continue
            state["proposals"].append(validated_finding.dict())
            final_proposals.append(validated_finding)
            
        save_state(state)
        return {"status": "success", "new_proposals": final_proposals}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API Error: {str(e)}")

@app.post("/api/proposals/{proposal_id}/commit")
async def commit_proposal(proposal_id: str):
    state = load_state()
    proposal_idx = next((i for i, p in enumerate(state["proposals"]) if p["id"] == proposal_id), None)
    
    if proposal_idx is None:
        raise HTTPException(status_code=404, detail="Proposal not found")
        
    proposal = state["proposals"].pop(proposal_idx)
    proposal["status"] = "Verified"
    proposal["commit_state"]["workspace"] = "Committed"
    proposal["commit_state"]["updated_at"] = datetime.utcnow().isoformat()
    
    state["findings"].append(proposal)
    save_state(state)
    return {"status": "success", "committed_finding": proposal}

@app.post("/api/socratic/review")
async def socratic_review():
    state = load_state()
    findings = state.get("findings", [])
    proposals = state.get("proposals", [])

    if not findings and not proposals:
        empty = SocraticDraft(
            identified_gap="Workspace is empty — no findings or proposals to analyze yet.",
            socratic_questions=[
                "What primary source or claim should we anchor the first finding on?",
                "Which research question would make the highest-value starting hypothesis?",
            ],
            proposed_hypothesis=ProposedHypothesis(
                title="Seed the workspace with an initial finding",
                details="Run a research pass on a concrete query to populate the knowledge base before Socratic analysis.",
                confidence_score=0,
            ),
        )
        return empty

    system_prompt = (
        "Ти — Socratic Co-Pilot. Проаналізуй поточну базу знань (findings) та пропозиції (proposals). "
        "Знайди логічні розриви (Gaps) або суперечності. Сформулюй 2-3 Сократичні запитання для вирішення "
        "цього розриву і запропонуй нову картку-гіпотезу для заповнення цієї прогалини. "
        "Відповідь має суворо відповідати JSON-схемі SocraticDraft.\\n"
        "{\\n"
        '  "identified_gap": "Опис логічного розриву або конфлікту між поточними картками",\\n'
        '  "socratic_questions": ["Запитання 1", "Запитання 2", "Запитання 3"],\\n'
        '  "proposed_hypothesis": {\\n'
        '    "title": "Коротка назва гіпотези",\\n'
        '    "details": "Детальне пояснення гіпотези, що заповнює прогалину",\\n'
        '    "confidence_score": 70\\n'
        "  }\\n"
        "}\\n"
        "confidence_score має бути цілим числом від 0 до 100."
    )

    user_content = (
        f"Current findings:\\n{json.dumps(findings, ensure_ascii=False)}\\n\\n"
        f"Current proposals:\\n{json.dumps(proposals, ensure_ascii=False)}"
    )

    try:
        print(">>> Відправляємо стан в OpenAI (Socratic Co-Pilot)...")
        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ],
                response_format={"type": "json_object"}
            )
        except Exception as e:
            print(f"❌ КРИТИЧНА ПОМИЛКА OPENAI API: {e}")
            raise e

        raw_content = response.choices[0].message.content
        print(f">>> Отримано сиру відповідь: {raw_content[:200]}...")

        result_data = json.loads(extract_json(raw_content))
        # Draft не зберігаємо у файл — це лише пропозиція (Context Git draft branch)
        draft = SocraticDraft(**result_data)
        return draft

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Socratic Monitor Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
