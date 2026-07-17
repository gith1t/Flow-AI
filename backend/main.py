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

# Завантажує змінні з .env (OPENAI_API_KEY) у середовище процесу
load_dotenv()

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
    
    if not findings:
        return {"clashes": []}
        
    system_prompt = (
        "You are a Socratic AI co-pilot. Your job is to review the current committed findings "
        "and detect logical gaps, conflicts, or contradictions (Clashes) based on classical Greek epic lore. "
        "Return a valid JSON object in this format:\n"
        "{\n"
        '  "clashes": [\n'
        "    {\n"
        '      "id": "clash_1",\n'
        '      "title": "Title of the clash/contradiction",\n'
        '      "status": "Clash",\n'
        '      "details": "Explanation of why these findings conflict or what critical piece is missing.",\n'
        '      "commit_state": {\n'
        '        "revision": 1,\n'
        '        "workspace": "Proposal",\n'
        '        "updated_at": "timestamp"\n'
        "      },\n"
        '      "evidence": [],\n'
        '      "relations": [\n'
        '        {"target_id": "id_of_conflicting_finding", "type": "contradicts"}\n'
        "      ]\n"
        "    }\n"
        "  ]\n"
        "}\n"
        "If no clashes are found, return empty list: {\"clashes\": []}."
    )
    
    user_content = f"Current findings:\n{json.dumps(findings, ensure_ascii=False)}"
    
    try:
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ],
                response_format={"type": "json_object"}
            )
        except Exception as e:
            print(f"❌ КРИТИЧНА ПОМИЛКА OPENAI API: {e}")
            raise e
        

        result_data = json.loads(extract_json(response.choices[0].message.content))
        clashes = result_data.get("clashes", [])
        
        for clash in clashes:
            clash["commit_state"]["updated_at"] = datetime.utcnow().isoformat()
            state["proposals"].append(clash)
            
        save_state(state)
        return {"clashes": clashes}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Socratic Monitor Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
