from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import json
import os
import re
import copy
import hashlib
from datetime import datetime
from io import BytesIO
from openai import OpenAI
from dotenv import load_dotenv
from pypdf import PdfReader

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
    source_id: Optional[str] = None
    page_number: Optional[int] = None
    start_char: Optional[int] = None
    end_char: Optional[int] = None

class Relation(BaseModel):
    target_id: str
    type: str
    origin: str = "ai"
    confidence_score: Optional[int] = None
    evidence: Optional[str] = None
    reason: Optional[str] = None

class CommitState(BaseModel):
    revision: int
    workspace: str
    updated_at: str

class Finding(BaseModel):
    id: str
    title: str
    status: str
    details: str
    confidence_score: Optional[int] = Field(default=None)
    commit_state: CommitState
    evidence: List[Evidence] = []
    relations: List[Relation] = []
    topic_id: Optional[str] = None
    source_id: Optional[str] = None
    source_title: Optional[str] = None

class ResearchTopic(BaseModel):
    id: str
    title: str
    query: str
    created_at: str
    updated_at: str
    source_count: int = 0
    finding_count: int = 0
    suggested_layout: str = "graph"

class ResearchSource(BaseModel):
    id: str
    topic_id: str
    title: str
    created_at: str
    character_count: int = 0
    page_count: int = 0
    document_hash: Optional[str] = None

class ResearchRequest(BaseModel):
    query: str
    text: str
    target_lang: Optional[str] = "auto"
    topic_id: Optional[str] = None
    topic_title: Optional[str] = None
    source_title: Optional[str] = None
    source_page_count: int = 0

class SocraticRequest(BaseModel):
    target_lang: Optional[str] = "auto"
    fact_id: Optional[str] = None
    fact_text: Optional[str] = None
    topic_id: Optional[str] = None

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
    topic_id: Optional[str] = None

class RelationCreateRequest(BaseModel):
    target_id: str
    type: str = "manual link"
    evidence: Optional[str] = None
    reason: Optional[str] = None

class DiscoverRelationsRequest(BaseModel):
    target_lang: Optional[str] = "auto"

class UiNodePosition(BaseModel):
    id: str
    x: float
    y: float

class WorkspaceUiState(BaseModel):
    mode: Optional[str] = "graph"
    selected_node_id: Optional[str] = None
    node_positions: List[UiNodePosition] = Field(default_factory=list)

class UiStateUpdateRequest(BaseModel):
    ui_state: Optional[WorkspaceUiState] = None

class WorkspaceSnapshot(BaseModel):
    revision: int
    timestamp: str
    action: str

class SourceExtractionResponse(BaseModel):
    source_title: str
    text: str
    page_count: int
    character_count: int

class ResearchResponse(BaseModel):
    status: str
    new_proposals: List[Finding] = Field(default_factory=list)
    topic: ResearchTopic
    suggested_layout: str = Field(
        default="graph",
        description="One of: graph, tree, timeline, comparison",
    )

class WorkspaceState(BaseModel):
    model_config = ConfigDict(extra="allow")
    findings: List[Any] = []
    proposals: List[Any] = []
    topics: List[ResearchTopic] = Field(default_factory=list)
    sources: List[ResearchSource] = Field(default_factory=list)
    history: List[WorkspaceSnapshot] = Field(default_factory=list)
    ui_state: Optional[WorkspaceUiState] = None
    suggested_layout: str = Field(
        default="graph",
        description="One of: graph, tree, timeline, comparison",
    )

# --- STATE MANAGEMENT ---
STATE_FILE = "workspace_state.json"
MODEL_NAME = "gpt-5.6-luna"
VALID_LAYOUTS = {"graph", "tree", "timeline", "comparison"}
LEGACY_TOPIC_ID = "topic-legacy-workspace"
MAX_SOURCE_BYTES = 12 * 1024 * 1024
SNAPSHOT_LIMIT = 30
ALLOWED_RELATION_TYPES = {
    "supports",
    "contradicts",
    "explains",
    "causes",
    "compares_with",
    "extends",
    "manual link",
    "related",
}

def utc_now() -> str:
    return datetime.utcnow().isoformat()

def create_id(prefix: str, index: int = 0) -> str:
    return f"{prefix}_{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}_{index}"

def document_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def evidence_location(source_text: str, quote: str) -> Optional[Dict[str, int]]:
    if not quote:
        return None

    start_char = source_text.find(quote)
    if start_char < 0:
        return None

    page_markers = list(re.finditer(r"\[Page\s+(\d+)\]", source_text[: start_char + 1]))
    page_number = int(page_markers[-1].group(1)) if page_markers else 1

    return {
        "start_char": start_char,
        "end_char": start_char + len(quote),
        "page_number": page_number,
    }

def validate_evidence(
    evidence_items: Any,
    source_text: str,
    source_id: str,
    source_title: str,
) -> List[Dict[str, Any]]:
    if not isinstance(evidence_items, list):
        return []

    verified_items = []
    for index, evidence in enumerate(evidence_items):
        if not isinstance(evidence, dict):
            continue
        quote = str(evidence.get("quote") or "").strip()
        location = evidence_location(source_text, quote)
        if not location:
            continue

        verified_items.append(
            {
                "id": evidence.get("id") or f"evidence_{index + 1}",
                "title": evidence.get("title") or source_title,
                "quote": quote,
                "source_url": evidence.get("source_url"),
                "source_id": source_id,
                **location,
            }
        )

    return verified_items

def relation_evidence_is_valid(
    relation_evidence: Optional[str], source_finding: Dict[str, Any], target_finding: Dict[str, Any]
) -> bool:
    if not relation_evidence:
        return False

    evidence_quotes = [
        evidence.get("quote", "")
        for finding in (source_finding, target_finding)
        for evidence in finding.get("evidence", [])
        if isinstance(evidence, dict)
    ]
    return relation_evidence in evidence_quotes

def append_snapshot(state: Dict[str, Any], action: str) -> WorkspaceSnapshot:
    revision = int(state.get("revision", 0)) + 1
    timestamp = utc_now()
    snapshot = {
        "revision": revision,
        "timestamp": timestamp,
        "action": action,
        "state": {
            "findings": copy.deepcopy(state.get("findings", [])),
            "proposals": copy.deepcopy(state.get("proposals", [])),
            "topics": copy.deepcopy(state.get("topics", [])),
            "sources": copy.deepcopy(state.get("sources", [])),
            "ui_state": copy.deepcopy(state.get("ui_state")),
            "suggested_layout": state.get("suggested_layout", "graph"),
        },
    }
    state["revision"] = revision
    state.setdefault("snapshots", []).append(snapshot)
    state["snapshots"] = state["snapshots"][-SNAPSHOT_LIMIT:]
    return WorkspaceSnapshot.model_validate(snapshot)

def workspace_response(state: Dict[str, Any]) -> WorkspaceState:
    normalized_state = normalize_state(state)
    history = [
        WorkspaceSnapshot.model_validate(snapshot)
        for snapshot in normalized_state.get("snapshots", [])
        if isinstance(snapshot, dict)
    ]
    return WorkspaceState(
        findings=normalized_state["findings"],
        proposals=normalized_state["proposals"],
        topics=normalized_state["topics"],
        sources=normalized_state["sources"],
        history=history,
        ui_state=normalized_state.get("ui_state"),
        suggested_layout=normalized_state["suggested_layout"],
    )

def normalize_state(state: Dict[str, Any]) -> Dict[str, Any]:
    state.setdefault("findings", [])
    state.setdefault("proposals", [])
    state.setdefault("topics", [])
    state.setdefault("sources", [])
    state.setdefault("snapshots", [])
    state.setdefault("revision", 0)
    state.setdefault("ui_state", None)
    state.setdefault("suggested_layout", "graph")

    has_legacy_records = any(
        not item.get("topic_id")
        for item in [*state["findings"], *state["proposals"]]
        if isinstance(item, dict)
    )

    if has_legacy_records and not any(
        topic.get("id") == LEGACY_TOPIC_ID
        for topic in state["topics"]
        if isinstance(topic, dict)
    ):
        timestamp = utc_now()
        state["topics"].append(
            {
                "id": LEGACY_TOPIC_ID,
                "title": "Existing workspace",
                "query": "Existing workspace",
                "created_at": timestamp,
                "updated_at": timestamp,
                "source_count": 0,
                "finding_count": 0,
                "suggested_layout": "graph",
            }
        )

    for item in [*state["findings"], *state["proposals"]]:
        if isinstance(item, dict) and not item.get("topic_id"):
            item["topic_id"] = LEGACY_TOPIC_ID

    for source in state["sources"]:
        if isinstance(source, dict) and not source.get("topic_id"):
            source["topic_id"] = LEGACY_TOPIC_ID

    for topic in state["topics"]:
        if not isinstance(topic, dict):
            continue
        topic_id = topic.get("id")
        topic["source_count"] = sum(
            1
            for source in state["sources"]
            if isinstance(source, dict) and source.get("topic_id") == topic_id
        )
        topic["finding_count"] = sum(
            1
            for finding in state["findings"]
            if isinstance(finding, dict) and finding.get("topic_id") == topic_id
        )

    return state

def load_state() -> Dict[str, Any]:
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r", encoding="utf-8") as f:
            return normalize_state(json.load(f))
    return normalize_state({"findings": [], "proposals": []})

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
    return workspace_response(load_state())

@app.post("/api/sources/extract", response_model=SourceExtractionResponse)
async def extract_source(file: UploadFile = File(...)) -> SourceExtractionResponse:
    filename = file.filename or "Research document"
    extension = os.path.splitext(filename)[1].lower()
    raw_content = await file.read()

    if not raw_content:
        raise HTTPException(status_code=422, detail="The uploaded source is empty")
    if len(raw_content) > MAX_SOURCE_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Source is too large. Upload a file smaller than 12 MB.",
        )

    try:
        if extension == ".pdf":
            reader = PdfReader(BytesIO(raw_content))
            pages = [
                f"[Page {index + 1}]\n{page.extract_text() or ''}"
                for index, page in enumerate(reader.pages)
            ]
            text = "\n\n".join(pages).strip()
            page_count = len(pages)
        elif extension in {".txt", ".md", ".csv", ".json"}:
            text = raw_content.decode("utf-8-sig").strip()
            page_count = 0
        else:
            raise HTTPException(
                status_code=415,
                detail="Supported files: PDF, TXT, Markdown, CSV, and JSON.",
            )
    except UnicodeDecodeError as error:
        raise HTTPException(
            status_code=422,
            detail="Text files must use UTF-8 encoding.",
        ) from error
    except Exception as error:
        if isinstance(error, HTTPException):
            raise
        raise HTTPException(
            status_code=422,
            detail="Flow-AI could not extract readable text from this PDF.",
        ) from error

    if not text:
        raise HTTPException(
            status_code=422,
            detail="No readable text was found in the uploaded source.",
        )

    return SourceExtractionResponse(
        source_title=filename,
        text=text,
        page_count=page_count,
        character_count=len(text),
    )

@app.put("/api/workspace/ui-state")
async def update_ui_state(payload: UiStateUpdateRequest):
    state = load_state()
    if payload.ui_state is not None:
        state["ui_state"] = payload.ui_state.model_dump()
        save_state(state)
    return {"status": "success", "ui_state": state.get("ui_state")}


@app.post("/api/workspace/checkout/{revision}", response_model=WorkspaceState)
async def checkout_workspace(revision: int, payload: Optional[UiStateUpdateRequest] = None) -> WorkspaceState:
    state = load_state()
    snapshot = next(
        (
            item
            for item in state.get("snapshots", [])
            if isinstance(item, dict) and item.get("revision") == revision
        ),
        None,
    )

    if snapshot is None:
        raise HTTPException(status_code=404, detail="Workspace revision not found")

    restored_state = copy.deepcopy(snapshot.get("state", {}))
    restored_state["snapshots"] = copy.deepcopy(state.get("snapshots", []))
    restored_state["revision"] = state.get("revision", 0)
    if payload and payload.ui_state is not None:
        restored_state["ui_state"] = payload.ui_state.model_dump()
    normalize_state(restored_state)
    append_snapshot(restored_state, f"Restored workspace to revision r{revision}")
    save_state(restored_state)
    return workspace_response(restored_state)

@app.post("/api/research", response_model=ResearchResponse)
async def start_research(payload: ResearchRequest) -> ResearchResponse:
    state = load_state()
    requested_topic_id = (payload.topic_id or "").strip()
    topic = next(
        (item for item in state["topics"] if item.get("id") == requested_topic_id),
        None,
    )

    if requested_topic_id and topic is None:
        raise HTTPException(status_code=404, detail="Research topic not found")

    if topic is None:
        timestamp = utc_now()
        topic = {
            "id": create_id("topic", len(state["topics"])),
            "title": (payload.topic_title or payload.query).strip(),
            "query": payload.query.strip(),
            "created_at": timestamp,
            "updated_at": timestamp,
            "source_count": 0,
            "finding_count": 0,
            "suggested_layout": "graph",
        }
        state["topics"].append(topic)

    topic_id = topic["id"]
    topic_findings = [
        finding
        for finding in state["findings"]
        if finding.get("topic_id") == topic_id
    ]
    topic_finding_by_id = {
        finding.get("id"): finding for finding in topic_findings if finding.get("id")
    }
    existing_findings_context = [
        {
            "id": finding.get("id"),
            "title": finding.get("title"),
            "details": finding.get("details"),
            "evidence": [
                evidence.get("quote")
                for evidence in finding.get("evidence", [])
                if isinstance(evidence, dict) and evidence.get("quote")
            ],
        }
        for finding in topic_findings
    ]

    system_prompt = (
        "You are an expert research AI building an evidence-grounded knowledge graph. "
        "Analyze the supplied document and extract high-value findings that answer the "
        "user's query. Every proposed finding must be supported by an exact quotation "
        "from the supplied document. Do not invent evidence, sources, relationships, or facts. "
        "For each proposal, create relations only when it has a direct, meaningful semantic "
        "connection to one of the supplied Existing verified findings. A relation target_id "
        "must exactly equal an existing finding ID; never reference a proposed finding ID or "
        "invent an ID. Use concise relation types such as supports, contradicts, explains, "
        "causes, compares_with, or extends. Every relation must include an exact evidence "
        "quote already present in the proposal or an Existing verified finding. Return an empty relations list only when no "
        "evidence-grounded connection exists. Return only a valid JSON object "
        "with this exact structure:\n"
        "{\n"
        '  "suggested_layout": "graph",\n'
        '  "proposals": [\n'
        "    {\n"
        '      "id": "prop_1",\n'
        '      "title": "Short finding title",\n'
        '      "status": "Unidentified",\n'
        '      "details": "Evidence-based explanation of the finding",\n'
        '      "confidence_score": 80,\n'
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
        '      "relations": [{"target_id": "existing_finding_id", "type": "supports", "evidence": "EXACT supporting quotation", "confidence_score": 80}]\n'
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

    user_content = (
        f"Research topic: {topic['title']}\n"
        f"User Query: {payload.query}\n\n"
        "Existing verified findings in this topic (valid relation targets):\n"
        f"{json.dumps(existing_findings_context, ensure_ascii=False)}\n\n"
        f"Text to analyze:\n{payload.text}"
    )

    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            reasoning_effort="low",
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
            if requested_layout in VALID_LAYOUTS
            else "graph"
        )
        final_proposals = []
        source = {
            "id": create_id("source", len(state["sources"])),
            "topic_id": topic_id,
            "title": (payload.source_title or "Research document").strip(),
            "created_at": utc_now(),
            "character_count": len(payload.text),
            "page_count": max(payload.source_page_count, 0),
            "document_hash": document_hash(payload.text),
        }

        for index, proposal in enumerate(result_data.get("proposals", [])):
            proposal["id"] = create_id("prop", index)
            proposal.setdefault("commit_state", {})
            proposal["commit_state"].setdefault("revision", 1)
            proposal["commit_state"].setdefault("workspace", "Proposal")
            proposal["commit_state"]["updated_at"] = utc_now()
            proposal.setdefault("status", "Unidentified")
            proposal["evidence"] = validate_evidence(
                proposal.get("evidence", []),
                payload.text,
                source["id"],
                source["title"],
            )
            proposal.setdefault("relations", [])
            proposal["topic_id"] = topic_id
            proposal["source_id"] = source["id"]
            proposal["source_title"] = source["title"]

            if not proposal["evidence"]:
                continue

            verified_relations = []
            for relation in proposal["relations"]:
                if not isinstance(relation, dict):
                    continue
                target_id = relation.get("target_id")
                target_finding = topic_finding_by_id.get(target_id)
                relation_type = relation.get("type", "related")
                if not target_finding or relation_type not in ALLOWED_RELATION_TYPES:
                    continue
                if not relation_evidence_is_valid(
                    relation.get("evidence"),
                    {"evidence": proposal["evidence"]},
                    target_finding,
                ):
                    continue
                relation["origin"] = "ai"
                verified_relations.append(relation)
            proposal["relations"] = verified_relations

            try:
                validated_proposal = Finding(**proposal)
            except Exception:
                continue

            state.setdefault("proposals", []).append(validated_proposal.model_dump())
            final_proposals.append(validated_proposal)

        state["sources"].append(source)
        topic["updated_at"] = utc_now()
        topic["suggested_layout"] = suggested_layout
        state["suggested_layout"] = suggested_layout
        normalize_state(state)
        append_snapshot(state, f"Analyzed source: {source['title']}")
        save_state(state)

        return ResearchResponse(
            status="success",
            new_proposals=final_proposals,
            topic=ResearchTopic.model_validate(topic),
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
    proposal["commit_state"]["revision"] = int(state.get("revision", 0)) + 1
    proposal["commit_state"]["updated_at"] = utc_now()
    
    state["findings"].append(proposal)
    normalize_state(state)
    append_snapshot(state, f"Committed finding: {proposal['title']}")
    save_state(state)
    return {"status": "success", "committed_finding": proposal}

@app.post("/api/topics/{topic_id}/relations/discover")
async def discover_relations(
    topic_id: str, payload: DiscoverRelationsRequest
):
    state = load_state()
    topic = next((item for item in state["topics"] if item.get("id") == topic_id), None)
    if topic is None:
        raise HTTPException(status_code=404, detail="Research topic not found")

    findings = [
        finding for finding in state["findings"] if finding.get("topic_id") == topic_id
    ]
    if len(findings) < 2:
        return {"status": "success", "created": 0, "relations": []}

    system_prompt = (
        "You are a research graph curator. Compare the supplied verified findings and "
        "identify only direct, evidence-grounded relationships. Return only valid JSON: \n"
        "{\"relations\": [{\"source_id\": \"finding_id\", \"target_id\": \"finding_id\", "
        "\"type\": \"supports\", \"confidence_score\": 80, \"reason\": \"short explanation\", "
        "\"evidence\": \"EXACT quotation from one of the two findings\"}]}\n"
        "Allowed relation types: supports, contradicts, explains, causes, compares_with, extends, related. "
        "Use only supplied IDs. Never link a finding to itself. Omit weak, duplicate, or unsupported links."
    )
    if payload.target_lang and payload.target_lang != "auto":
        system_prompt += (
            "\nCRITICAL: You MUST generate your ENTIRE response strictly in the "
            f"{payload.target_lang} language."
        )

    graph_input = [
        {
            "id": finding["id"],
            "title": finding["title"],
            "details": finding["details"],
            "evidence": [
                evidence.get("quote")
                for evidence in finding.get("evidence", [])
                if isinstance(evidence, dict) and evidence.get("quote")
            ],
        }
        for finding in findings
    ]

    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            reasoning_effort="low",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(graph_input, ensure_ascii=False)},
            ],
            response_format={"type": "json_object"},
        )
        result = json.loads(extract_json(response.choices[0].message.content or "{}"))
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Connection discovery failed: {str(error)}")

    finding_by_id = {finding["id"]: finding for finding in findings}
    created_relations = []
    for candidate in result.get("relations", []):
        if not isinstance(candidate, dict):
            continue
        source_id = candidate.get("source_id")
        target_id = candidate.get("target_id")
        relation_type = candidate.get("type")
        source_finding = finding_by_id.get(source_id)
        target_finding = finding_by_id.get(target_id)
        if (
            not source_finding
            or not target_finding
            or source_id == target_id
            or relation_type not in ALLOWED_RELATION_TYPES
            or not relation_evidence_is_valid(
                candidate.get("evidence"), source_finding, target_finding
            )
        ):
            continue

        already_exists = any(
            relation.get("target_id") == target_id
            and relation.get("type") == relation_type
            for relation in source_finding.get("relations", [])
            if isinstance(relation, dict)
        )
        if already_exists:
            continue

        confidence_score = candidate.get("confidence_score")
        relation = Relation(
            target_id=target_id,
            type=relation_type,
            origin="ai",
            confidence_score=(
                max(0, min(100, int(confidence_score)))
                if isinstance(confidence_score, (int, float))
                else None
            ),
            evidence=candidate.get("evidence"),
            reason=candidate.get("reason"),
        )
        source_finding.setdefault("relations", []).append(relation.model_dump())
        created_relations.append({"source_id": source_id, **relation.model_dump()})

    if created_relations:
        append_snapshot(state, f"Discovered {len(created_relations)} graph connections")
        save_state(state)

    return {
        "status": "success",
        "created": len(created_relations),
        "relations": created_relations,
    }

@app.post("/api/findings/{finding_id}/relations")
async def create_manual_relation(
    finding_id: str, payload: RelationCreateRequest
):
    state = load_state()
    source_finding = next(
        (finding for finding in state["findings"] if finding.get("id") == finding_id),
        None,
    )
    target_finding = next(
        (finding for finding in state["findings"] if finding.get("id") == payload.target_id),
        None,
    )
    if source_finding is None or target_finding is None:
        raise HTTPException(status_code=404, detail="Finding for manual relation not found")
    if finding_id == payload.target_id:
        raise HTTPException(status_code=422, detail="A finding cannot link to itself")

    relation_type = payload.type.strip().lower() or "manual link"
    existing_relation = next(
        (
            relation
            for relation in source_finding.get("relations", [])
            if relation.get("target_id") == payload.target_id
            and relation.get("type") == relation_type
            and relation.get("origin") == "manual"
        ),
        None,
    )
    if existing_relation:
        return {"status": "success", "relation": existing_relation}

    relation = Relation(
        target_id=payload.target_id,
        type=relation_type,
        origin="manual",
        evidence=payload.evidence,
        reason=payload.reason or "Created manually on the graph canvas.",
    )
    source_finding.setdefault("relations", []).append(relation.model_dump())
    append_snapshot(state, f"Created manual connection: {source_finding['title']}")
    save_state(state)
    return {"status": "success", "relation": relation}

@app.delete("/api/findings/{finding_id}/relations/{target_id}")
async def delete_manual_relation(finding_id: str, target_id: str):
    state = load_state()
    source_finding = next(
        (finding for finding in state["findings"] if finding.get("id") == finding_id),
        None,
    )
    if source_finding is None:
        raise HTTPException(status_code=404, detail="Source finding not found")

    relations = source_finding.get("relations", [])
    remaining_relations = [
        relation
        for relation in relations
        if not (
            relation.get("target_id") == target_id
            and relation.get("origin") == "manual"
        )
    ]
    if len(remaining_relations) == len(relations):
        raise HTTPException(status_code=404, detail="Manual relation not found")

    source_finding["relations"] = remaining_relations
    append_snapshot(state, f"Removed manual connection from: {source_finding['title']}")
    save_state(state)
    return {"status": "success"}

@app.post("/api/socratic/review", response_model=SocraticDraft)
async def socratic_review(request: SocraticRequest) -> SocraticDraft:
    state = load_state()
    findings = [
        finding
        for finding in state.get("findings", [])
        if not request.topic_id or finding.get("topic_id") == request.topic_id
    ]
    proposals = [
        proposal
        for proposal in state.get("proposals", [])
        if not request.topic_id or proposal.get("topic_id") == request.topic_id
    ]

    if not findings and not proposals:
        return SocraticDraft(
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

    selected_fact = next(
        (finding for finding in findings if finding.get("id") == request.fact_id),
        None,
    )
    if request.fact_id and selected_fact is None:
        raise HTTPException(status_code=404, detail="Selected finding was not found in this topic")

    target_instruction = (
        "You are an AI Red Teamer. Critique only the targeted fact below. Attack its "
        "logic, unstated assumptions, evidentiary basis, missing context, and possible "
        "contradictions with the workspace. Do not drift into a generic workspace review.\n"
        f"Target fact ID: {selected_fact['id']}\n"
        f"Target fact title: {selected_fact['title']}\n"
        f"Target fact text: {selected_fact['details']}\n"
        if selected_fact
        else "You are a Socratic Co-Pilot. Critique the entire workspace and identify its "
        "most consequential logical gap, unsupported claim, or contradiction.\n"
    )

    system_prompt = (
        f"{target_instruction}"
        "Use only the supplied findings and proposals as evidence. Do not invent sources "
        "or quotations. Return only a valid JSON object in this exact format:\n"
        "{\n"
        '  "identified_gap": "The precise logical gap or vulnerability",\n'
        '  "socratic_questions": ["Question 1", "Question 2", "Question 3"],\n'
        '  "proposed_hypothesis": {\n'
        '    "title": "Short hypothesis name",\n'
        '    "details": "Evidence-based hypothesis that addresses the gap",\n'
        '    "evidence": "EXACT quotation from an existing finding",\n'
        '    "confidence_score": 70\n'
        "  }\n"
        "}\n"
        "confidence_score must be an integer from 0 to 100."
    )

    if request.target_lang and request.target_lang != "auto":
        system_prompt += (
            "\nCRITICAL: You MUST generate your ENTIRE response strictly in the "
            f"{request.target_lang} language, completely ignoring the language of the "
            "source document."
        )

    user_content = (
        f"Current findings:\n{json.dumps(findings, ensure_ascii=False)}\n\n"
        f"Current proposals:\n{json.dumps(proposals, ensure_ascii=False)}"
    )

    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            reasoning_effort="low",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            response_format={"type": "json_object"},
        )
        raw_content = response.choices[0].message.content or "{}"
        result_data = json.loads(extract_json(raw_content))
        draft = SocraticDraft(**result_data)
        workspace_evidence = {
            evidence.get("quote")
            for finding in findings
            for evidence in finding.get("evidence", [])
            if isinstance(evidence, dict) and evidence.get("quote")
        }
        if draft.proposed_hypothesis.evidence and (
            draft.proposed_hypothesis.evidence not in workspace_evidence
        ):
            raise HTTPException(
                status_code=502,
                detail="Socratic draft evidence is not an exact quote from the workspace.",
            )
        return draft
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Socratic Monitor Error: {str(error)}")

@app.post("/api/socratic/commit")
async def socratic_commit(payload: HypothesisCommitRequest):
    state = load_state()
    if payload.evidence:
        workspace_evidence = {
            evidence.get("quote")
            for finding in state.get("findings", [])
            for evidence in finding.get("evidence", [])
            if isinstance(evidence, dict) and evidence.get("quote")
        }
        if payload.evidence not in workspace_evidence:
            raise HTTPException(
                status_code=422,
                detail="Socratic hypothesis evidence must be an exact workspace quote.",
            )
    topic = next(
        (item for item in state["topics"] if item.get("id") == payload.topic_id),
        None,
    )

    if payload.topic_id and topic is None:
        raise HTTPException(status_code=404, detail="Research topic not found")

    if topic is None:
        topic = state["topics"][0] if state["topics"] else None

    if topic is None:
        timestamp = utc_now()
        topic = {
            "id": LEGACY_TOPIC_ID,
            "title": "Socratic workspace",
            "query": "Socratic workspace",
            "created_at": timestamp,
            "updated_at": timestamp,
            "source_count": 0,
            "finding_count": 0,
            "suggested_layout": "graph",
        }
        state["topics"].append(topic)

    topic_id = topic["id"]
    finding = {
        "id": create_id("hyp", len(state.get("findings", []))),
        "title": payload.title,
        "status": "Verified",
        "details": payload.details,
        "commit_state": {
            "revision": int(state.get("revision", 0)) + 1,
            "workspace": "Committed",
            "updated_at": utc_now(),
        },
        "evidence": (
            [
                {
                    "id": create_id("ev"),
                    "title": "Socratic hypothesis evidence",
                    "quote": payload.evidence,
                }
            ]
            if payload.evidence
            else []
        ),
        "relations": [],
        "topic_id": topic_id,
        "source_id": None,
        "source_title": "Socratic review",
    }
    state.setdefault("findings", []).append(finding)
    normalize_state(state)
    append_snapshot(state, f"Committed Socratic hypothesis: {finding['title']}")
    save_state(state)
    return {"status": "success", "committed_finding": finding}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
