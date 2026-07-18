from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict
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
    target_lang: Optional[str] = "auto"

class SocraticRequest(BaseModel):
    target_lang: Optional[str] = "auto"
    fact_id: Optional[str] = None
    fact_text: Optional[str] = None

class ProposedHypothesis(BaseModel):
    title: str
    details: str
    confidence_score: int
    evidence: str

class SocraticDraft(BaseModel):
    identified_gap: str
    socratic_questions: List[str]
    proposed_hypothesis: ProposedHypothesis

class HypothesisCommitRequest(BaseModel):
    title: str
    details: str
    confidence_score: int
    evidence: str

class ResearchResponse(BaseModel):
    status: str
    new_proposals: List[Finding] = Field(default_factory=list)
    suggested_layout: str = Field(
        default="graph",
        description="One of: graph, tree, timeline, comparison",
    )

class WorkspaceState(BaseModel):
    model_config = ConfigDict(extra="allow")
    findings: List[Any] = []
    proposals: List[Any] = []
    suggested_layout: str = Field(
        default="graph",
        description="One of: graph, tree, timeline, comparison",
    )

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
    state = load_state()
    state.setdefault("suggested_layout", "graph")
    return WorkspaceState.model_validate(state)

@app.post("/api/research", response_model=ResearchResponse)
async def start_research(payload: ResearchRequest) -> ResearchResponse:
    state = load_state()
    system_prompt = (
        "You are an expert research AI. Analyze the supplied document and extract "
        "high-value findings that answer the user's query. Every proposed finding must "
        "be supported by an exact quotation from the supplied document. Do not invent "
        "evidence, sources, relationships, or facts. Return only a valid JSON object "
        "with this exact structure:\n"
        "{\n"
        '  "suggested_layout": "graph",\n'
        '  "proposals": [\n'
        "    {\n"
        '      "id": "prop_1",\n'
        '      "title": "Short finding title",\n'
        '      "status": "Unidentified",\n'
        '      "details": "Evidence-based explanation of the finding",\n'
        '      "commit_state": {\n'
        '        "revision": 1,\n'
        '        "workspace": "Proposal",\n'
        '        "updated_at": "current_timestamp"\n'
        "      },\n"
        '      "evidence": [\n'
        "        {\n"
        '          "id": "ev_1",\n'
        '          "title": "Source title",\n'
        '          "quote": "EXACT quotation from the supplied document"\n'
        "        }\n"
        "      ],\n"
        '      "relations": []\n'
        "    }\n"
        "  ]\n"
        "}\n"
        "The suggested_layout value must be exactly one of graph, tree, timeline, comparison. "
        "Use timeline for chronological material, comparison for two or more entities being "
        "compared, tree for hierarchy or parent-child structure, and graph for all other cases."
    )

    if payload.target_lang and payload.target_lang != "auto":
        system_prompt += (
            "\nCRITICAL: You MUST generate your ENTIRE response strictly in the "
            f"{payload.target_lang} language, completely ignoring the language of the "
            "source document."
        )

    user_content = f"User Query: {payload.query}\n\nText to analyze:\n{payload.text}"

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            response_format={"type": "json_object"},
        )
        raw_content = response.choices[0].message.content or "{}"
        result_data = json.loads(extract_json(raw_content))
        requested_layout = result_data.get("suggested_layout", "graph")
        suggested_layout = (
            requested_layout
            if requested_layout in {"graph", "tree", "timeline", "comparison"}
            else "graph"
        )
        final_proposals = []

        for index, proposal in enumerate(result_data.get("proposals", [])):
            proposal["id"] = f"prop_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{index}"
            proposal.setdefault("commit_state", {})
            proposal["commit_state"].setdefault("revision", 1)
            proposal["commit_state"].setdefault("workspace", "Proposal")
            proposal["commit_state"]["updated_at"] = datetime.utcnow().isoformat()
            proposal.setdefault("status", "Unidentified")
            proposal.setdefault("evidence", [])
            proposal.setdefault("relations", [])

            try:
                validated_proposal = Finding(**proposal)
            except Exception:
                continue

            state.setdefault("proposals", []).append(validated_proposal.model_dump())
            final_proposals.append(validated_proposal)

        state["suggested_layout"] = suggested_layout
        save_state(state)

        return ResearchResponse(
            status="success",
            new_proposals=final_proposals,
            suggested_layout=suggested_layout,
        )
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"OpenAI API Error: {str(error)}")

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
async def socratic_review(payload: SocraticReviewRequest = None):
    if payload is None:
        payload = SocraticReviewRequest()
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
                evidence="",
            ),
        )
        return empty

    system_prompt = (
        "Ти — Socratic Co-Pilot. Проаналізуй поточну базу знань (findings) та пропозиції (proposals). "
        "Знайди логічні розриви (Gaps) або суперечності. Сформулюй 2-3 Сократичні запитання для вирішення "
        "цього розриву і запропонуй нову картку-гіпотезу для заповнення цієї прогалини. "
        "Твоя гіпотеза ПОВИННА супроводжуватися точною цитатою-доказом (evidence) з існуючих фактів (findings), "
        "щоб уникнути галюцинацій. Не вигадуй доказів, яких немає у findings. "
        "Відповідь має суворо відповідати JSON-схемі SocraticDraft.\\n"
        "{\\n"
        '  "identified_gap": "Опис логічного розриву або конфлікту між поточними картками",\\n'
        '  "socratic_questions": ["Запитання 1", "Запитання 2", "Запитання 3"],\\n'
        '  "proposed_hypothesis": {\\n'
        '    "title": "Коротка назва гіпотези",\\n'
        '    "details": "Детальне пояснення гіпотези, що заповнює прогалину",\\n'
        '    "evidence": "ТОЧНА цитата-доказ з існуючого факту (finding)",\\n'
        '    "confidence_score": 70\\n'
        "  }\\n"
        "}\\n"
        "confidence_score має бути цілим числом від 0 до 100."
        "CRITICAL REQUIREMENT: You MUST generate your response (titles, details, hypotheses, questions) IN THE EXACT SAME LANGUAGE as the provided Research Document or Workspace text."
    )

    # Прицілювання (Red Teaming) на конкретний факт
    if payload.fact_text:
        system_prompt = (
            "You are an AI Red Teamer. Critique THIS SPECIFIC FACT: "
            f"'{payload.fact_text}'. "
            "Find logical gaps, hidden assumptions, missing evidence, or contradictions "
            "between this fact and the rest of the knowledge base. "
            "Formulate 2-3 Socratic questions to resolve these gaps and propose a hypothesis "
            "card that fills the identified gap. "
            "Your hypothesis MUST be backed by an exact evidence quote from existing facts (findings) "
            "to avoid hallucinations. Do not invent evidence that is not in the findings. "
            "Respond strictly in the JSON schema SocraticDraft.\\n"
            "{\\n"
            '  "identified_gap": "Description of the logical gap or conflict for THIS fact",\\n'
            '  "socratic_questions": ["Question 1", "Question 2", "Question 3"],\\n'
            '  "proposed_hypothesis": {\\n'
            '    "title": "Short hypothesis name",\\n'
            '    "details": "Detailed explanation of the hypothesis filling the gap",\\n'
            '    "evidence": "EXACT evidence quote from an existing fact (finding)",\\n'
            '    "confidence_score": 70\\n'
            "  }\\n"
            "}\\n"
            "confidence_score must be an integer from 0 to 100."
            "CRITICAL REQUIREMENT: You MUST generate your response (titles, details, hypotheses, questions) IN THE EXACT SAME LANGUAGE as the provided Research Document or Workspace text."
        )

    if payload.target_lang and payload.target_lang != "auto":
        system_prompt += (
            f" OVERRIDE: The user explicitly requested the response language to be "
            f"'{payload.target_lang}'. You MUST generate your response in {payload.target_lang}, "
            f"regardless of the input text language."
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

@app.post("/api/socratic/commit")
async def socratic_commit(payload: HypothesisCommitRequest):
    state = load_state()
    finding = {
        "id": f"hyp_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{len(state.get('findings', []))}",
        "title": payload.title,
        "status": "Verified",
        "details": payload.details,
        "commit_state": {
            "revision": len(state.get("findings", [])) + 1,
            "workspace": "Committed",
            "updated_at": datetime.utcnow().isoformat(),
        },
        "evidence": [
            {
                "id": f"ev_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
                "title": "Socratic hypothesis evidence",
                "quote": payload.evidence,
            }
        ],
        "relations": [],
    }
    state.setdefault("findings", []).append(finding)
    save_state(state)
    return {"status": "success", "committed_finding": finding}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
