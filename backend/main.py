from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import json
import os
import re
import copy
import hashlib
import shutil
import unicodedata
from datetime import datetime, timezone
from io import BytesIO
from uuid import uuid4
from openai import OpenAI
from dotenv import load_dotenv

app = FastAPI(title="Yomirai Backend Engine")

# backend/main.py -> backend/.env
ENV_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(ENV_FILE)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(?::\d+)?$",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# The application may start without a key so local source extraction remains available.
client: Optional[OpenAI] = None


def has_openai_key() -> bool:
    return bool((os.getenv("OPENAI_API_KEY") or "").strip())


def get_openai_client(session_api_key: Optional[str] = None) -> OpenAI:
    api_key = (session_api_key or os.getenv("OPENAI_API_KEY") or "").strip()
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="OpenAI API key is not configured. Add a session key in Spotlight Ingestion or backend/.env.",
        )

    if session_api_key and session_api_key.strip():
        return OpenAI(api_key=api_key)

    global client
    if client is None:
        client = OpenAI(api_key=api_key)

    return client

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
    id: str = Field(default_factory=lambda: f"rel_{uuid4().hex}")
    target_id: str
    type: str
    origin: str = "ai"
    status: str = "verified"
    confidence_score: Optional[int] = Field(default=None, ge=0, le=100)
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
    confidence_score: Optional[int] = Field(default=None, ge=0, le=100)
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
    topic_fit_score: int = Field(default=100, ge=0, le=100)
    topic_fit_status: str = "aligned"
    topic_fit_reason: Optional[str] = None
    source_policy: str = "smart"

class ResearchRequest(BaseModel):
    query: str
    text: str
    target_lang: str = Field(default="auto", pattern=r"^(auto|en|uk)$")
    topic_id: Optional[str] = None
    topic_title: Optional[str] = None
    source_title: Optional[str] = None
    source_page_count: int = 0
    source_policy: str = Field(
        default="smart",
        pattern=r"^(smart|isolate_uncertain|import_without_links)$",
    )
    api_key: Optional[str] = Field(default=None, exclude=True)


class OpenAIConfigurationResponse(BaseModel):
    configured: bool

class SocraticRequest(BaseModel):
    target_lang: str = Field(default="auto", pattern=r"^(auto|en|uk)$")
    fact_id: Optional[str] = None
    fact_text: Optional[str] = None
    topic_id: Optional[str] = None
    api_key: Optional[str] = Field(default=None, exclude=True)

class ProposedHypothesis(BaseModel):
    title: str
    details: str
    confidence_score: int = Field(ge=0, le=100)
    evidence: str

class SocraticDraft(BaseModel):
    identified_gap: str
    socratic_questions: List[str]
    proposed_hypothesis: ProposedHypothesis

class HypothesisCommitRequest(BaseModel):
    title: str
    details: str
    confidence_score: int = Field(ge=0, le=100)
    evidence: str
    topic_id: Optional[str] = None

class RelationCreateRequest(BaseModel):
    target_id: str
    type: str = "manual link"
    evidence: Optional[str] = None
    reason: Optional[str] = None

class DiscoverRelationsRequest(BaseModel):
    target_lang: str = Field(default="auto", pattern=r"^(auto|en|uk)$")
    api_key: Optional[str] = Field(default=None, exclude=True)

class UiNodePosition(BaseModel):
    id: str
    x: float
    y: float

class WorkspaceUiState(BaseModel):
    mode: str = "graph"
    selected_node_id: Optional[str] = None
    node_positions: List[UiNodePosition] = Field(default_factory=list)
    manual_edges: List[Dict[str, Any]] = Field(default_factory=list)
    context_layers: List[Dict[str, Any]] = Field(default_factory=list)

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


class TopicFit(BaseModel):
    score: int = Field(ge=0, le=100)
    verdict: str
    reason: str

class ResearchResponse(BaseModel):
    status: str
    new_proposals: List[Finding] = Field(default_factory=list)
    topic: ResearchTopic
    warning: Optional[str] = None
    topic_fit: TopicFit
    source_quarantined: bool = False
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
    ui_state: WorkspaceUiState = Field(default_factory=WorkspaceUiState)
    suggested_layout: str = Field(
        default="graph",
        description="One of: graph, tree, timeline, comparison",
    )

# --- STATE MANAGEMENT ---
STATE_FILE = "workspace_state.json"
STATE_VERSION = 2
MODEL_NAME = "gpt-5.6-luna"
VALID_LAYOUTS = {"graph", "tree", "timeline", "comparison"}
LEGACY_TOPIC_ID = "topic-legacy-workspace"
MAX_SOURCE_BYTES = 12 * 1024 * 1024
SNAPSHOT_LIMIT = 30
TOPIC_FIT_ALIGNMENT_THRESHOLD = 65
TOPIC_FIT_QUARANTINE_THRESHOLD = 35
VALID_TOPIC_FIT_VERDICTS = {"aligned", "uncertain", "unrelated"}
VALID_RELATION_STATUSES = {"candidate", "verified", "rejected", "hypothesis"}
ALLOWED_RELATION_TYPES = {
    "supports",
    "contradicts",
    "explains",
    "causes",
    "compares_with",
    "extends",
    "manual link",
    "cross-topic hypothesis",
    "related",
}

def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()

def create_id(prefix: str, index: int = 0) -> str:
    return f"{prefix}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}_{index}"

def document_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def normalize_confidence_score(value: Any) -> Optional[int]:
    if isinstance(value, bool) or value is None:
        return None

    try:
        return max(0, min(100, int(float(value))))
    except (TypeError, ValueError):
        return None


def normalize_topic_fit(value: Any, default_reason: str) -> TopicFit:
    if not isinstance(value, dict):
        return TopicFit(score=50, verdict="uncertain", reason=default_reason)

    score = normalize_confidence_score(value.get("score"))
    verdict = str(value.get("verdict") or "uncertain").strip().lower()
    reason = str(value.get("reason") or default_reason).strip()

    if verdict not in VALID_TOPIC_FIT_VERDICTS:
        verdict = "uncertain"

    return TopicFit(
        score=50 if score is None else score,
        verdict=verdict,
        reason=reason or default_reason,
    )

EVIDENCE_CHARACTER_NORMALIZATION = str.maketrans(
    {
        "\u00a0": " ",
        "\u2018": "'",
        "\u2019": "'",
        "\u201a": "'",
        "\u201b": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u201e": '"',
        "\u201f": '"',
        "\u2013": "-",
        "\u2014": "-",
        "\u2212": "-",
    }
)


def normalize_evidence_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKC", value).translate(
        EVIDENCE_CHARACTER_NORMALIZATION
    )
    return re.sub(r"\s+", " ", normalized).strip()


def normalized_text_with_positions(value: str) -> tuple[str, List[int]]:
    normalized_characters: List[str] = []
    source_positions: List[int] = []
    previous_was_space = False

    for source_index, character in enumerate(value):
        normalized_character = unicodedata.normalize("NFKC", character).translate(
            EVIDENCE_CHARACTER_NORMALIZATION
        )

        for item in normalized_character:
            if item.isspace():
                if normalized_characters and not previous_was_space:
                    normalized_characters.append(" ")
                    source_positions.append(source_index)
                previous_was_space = True
                continue

            normalized_characters.append(item)
            source_positions.append(source_index)
            previous_was_space = False

    while normalized_characters and normalized_characters[-1] == " ":
        normalized_characters.pop()
        source_positions.pop()

    return "".join(normalized_characters), source_positions


def evidence_location(source_text: str, quote: str) -> Optional[Dict[str, Any]]:
    if not quote:
        return None

    start_char = source_text.find(quote)
    end_char = start_char + len(quote)

    if start_char < 0:
        normalized_source, source_positions = normalized_text_with_positions(source_text)
        normalized_quote = normalize_evidence_text(quote)
        normalized_start = normalized_source.find(normalized_quote)

        if normalized_start < 0 or not normalized_quote:
            return None

        normalized_end = normalized_start + len(normalized_quote) - 1
        start_char = source_positions[normalized_start]
        end_char = source_positions[normalized_end] + 1

    page_markers = list(re.finditer(r"\[Page\s+(\d+)\]", source_text[: start_char + 1]))
    page_number = int(page_markers[-1].group(1)) if page_markers else 1

    return {
        "start_char": start_char,
        "end_char": end_char,
        "page_number": page_number,
        "matched_quote": source_text[start_char:end_char],
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
        matched_quote = location.pop("matched_quote")

        verified_items.append(
            {
                "id": evidence.get("id") or f"evidence_{index + 1}",
                "title": evidence.get("title") or source_title,
                "quote": matched_quote,
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
            "ui_state": copy.deepcopy(
                state.get("ui_state", WorkspaceUiState().model_dump())
            ),
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
        ui_state=WorkspaceUiState.model_validate(normalized_state["ui_state"]),
        suggested_layout=normalized_state["suggested_layout"],
    )

def normalize_state(state: Dict[str, Any]) -> Dict[str, Any]:
    state.setdefault("state_version", STATE_VERSION)
    state.setdefault("findings", [])
    state.setdefault("proposals", [])
    state.setdefault("topics", [])
    state.setdefault("sources", [])
    state.setdefault("snapshots", [])
    state.setdefault("revision", 0)
    state.setdefault("ui_state", WorkspaceUiState().model_dump())
    state.setdefault("suggested_layout", "graph")

    try:
        state["ui_state"] = WorkspaceUiState.model_validate(
            state["ui_state"]
        ).model_dump()
    except Exception:
        state["ui_state"] = WorkspaceUiState().model_dump()

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

    for item in [*state["findings"], *state["proposals"]]:
        if not isinstance(item, dict):
            continue
        item["confidence_score"] = normalize_confidence_score(
            item.get("confidence_score")
        )
        for relation in item.get("relations", []):
            if isinstance(relation, dict):
                relation.setdefault("id", create_id("rel"))
                relation["origin"] = relation.get("origin") or "ai"
                relation_status = relation.get("status")
                if relation_status not in VALID_RELATION_STATUSES:
                    relation["status"] = "verified"
                relation["confidence_score"] = normalize_confidence_score(
                    relation.get("confidence_score")
                )

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

def state_backup_path() -> str:
    return f"{STATE_FILE}.bak"


def read_state_file(path: str) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as state_file:
        return json.load(state_file)


def load_state() -> Dict[str, Any]:
    if not os.path.exists(STATE_FILE):
        return normalize_state({"findings": [], "proposals": []})

    try:
        return normalize_state(read_state_file(STATE_FILE))
    except (OSError, json.JSONDecodeError) as primary_error:
        backup_path = state_backup_path()
        if os.path.exists(backup_path):
            try:
                return normalize_state(read_state_file(backup_path))
            except (OSError, json.JSONDecodeError):
                pass
        raise HTTPException(
            status_code=500,
            detail=(
                "Workspace state could not be read. The primary file and its backup "
                "are unavailable or invalid."
            ),
        ) from primary_error


def save_state(state: Dict[str, Any]):
    state["state_version"] = STATE_VERSION
    state_path = os.path.abspath(STATE_FILE)
    temporary_path = f"{state_path}.tmp"
    backup_path = state_backup_path()

    with open(temporary_path, "w", encoding="utf-8") as state_file:
        json.dump(state, state_file, indent=4, ensure_ascii=False)
        state_file.flush()
        os.fsync(state_file.fileno())

    if os.path.exists(state_path):
        try:
            read_state_file(state_path)
        except (OSError, json.JSONDecodeError):
            # Keep the last known-good backup if the primary state is corrupted.
            pass
        else:
            shutil.copy2(state_path, backup_path)

    os.replace(temporary_path, state_path)

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
@app.get("/api/config/openai", response_model=OpenAIConfigurationResponse)
async def get_openai_configuration() -> OpenAIConfigurationResponse:
    return OpenAIConfigurationResponse(configured=has_openai_key())


@app.get("/api/workspace")
async def get_workspace():
    return workspace_response(load_state())


@app.post("/api/workspace/reset", response_model=WorkspaceState)
async def reset_workspace() -> WorkspaceState:
    state = normalize_state(
        {
            "findings": [],
            "proposals": [],
            "topics": [],
            "sources": [],
            "snapshots": [],
            "revision": 0,
            "ui_state": WorkspaceUiState().model_dump(),
            "suggested_layout": "graph",
        }
    )
    save_state(state)
    return workspace_response(state)


@app.delete("/api/topics/{topic_id}", response_model=WorkspaceState)
async def delete_research_topic(topic_id: str) -> WorkspaceState:
    state = load_state()
    topic = next(
        (item for item in state["topics"] if item.get("id") == topic_id),
        None,
    )
    if topic is None:
        raise HTTPException(status_code=404, detail="Research topic not found")

    removed_finding_ids = {
        finding.get("id")
        for finding in state["findings"]
        if isinstance(finding, dict) and finding.get("topic_id") == topic_id
    }
    removed_node_ids = {
        f"topic-{topic_id}",
        *{f"finding-{finding_id}" for finding_id in removed_finding_ids if finding_id},
    }

    state["topics"] = [
        item for item in state["topics"] if item.get("id") != topic_id
    ]
    state["findings"] = [
        finding
        for finding in state["findings"]
        if finding.get("topic_id") != topic_id
    ]
    state["proposals"] = [
        proposal
        for proposal in state["proposals"]
        if proposal.get("topic_id") != topic_id
    ]
    state["sources"] = [
        source
        for source in state["sources"]
        if source.get("topic_id") != topic_id
    ]

    for collection in (state["findings"], state["proposals"]):
        for item in collection:
            if not isinstance(item, dict):
                continue
            item["relations"] = [
                relation
                for relation in item.get("relations", [])
                if isinstance(relation, dict)
                and relation.get("target_id") not in removed_finding_ids
            ]

    ui_state = state.get("ui_state", WorkspaceUiState().model_dump())
    ui_state["node_positions"] = [
        position
        for position in ui_state.get("node_positions", [])
        if position.get("id") not in removed_node_ids
    ]
    ui_state["manual_edges"] = [
        edge
        for edge in ui_state.get("manual_edges", [])
        if edge.get("source") not in removed_node_ids
        and edge.get("target") not in removed_node_ids
    ]
    ui_state["context_layers"] = [
        {
            **layer,
            "memberIds": [
                member_id
                for member_id in layer.get("memberIds", [])
                if member_id not in removed_node_ids
            ],
        }
        for layer in ui_state.get("context_layers", [])
        if isinstance(layer, dict)
        and len(
            [
                member_id
                for member_id in layer.get("memberIds", [])
                if member_id not in removed_node_ids
            ]
        ) >= 2
    ]
    if ui_state.get("selected_node_id") in removed_node_ids:
        ui_state["selected_node_id"] = None
    state["ui_state"] = ui_state

    normalize_state(state)
    append_snapshot(state, f"Deleted research topic: {topic['title']}")
    save_state(state)
    return workspace_response(state)


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
            try:
                from pypdf import PdfReader
            except ImportError as error:
                raise HTTPException(
                    status_code=503,
                    detail="PDF import requires pypdf. Run: python -m pip install -r requirements.txt",
                ) from error

            reader = PdfReader(BytesIO(raw_content))
            pages = [
                f"[Page {index + 1}]\n{page.extract_text() or ''}"
                for index, page in enumerate(reader.pages)
            ]
            text = "\n\n".join(pages).strip()
            page_count = len(pages)
        elif extension == ".docx":
            try:
                from docx import Document
            except ImportError as error:
                raise HTTPException(
                    status_code=503,
                    detail="DOCX import requires python-docx. Run: python -m pip install -r requirements.txt",
                ) from error

            document = Document(BytesIO(raw_content))
            paragraphs = [paragraph.text.strip() for paragraph in document.paragraphs]
            table_rows = [
                " | ".join(cell.text.strip() for cell in row.cells)
                for table in document.tables
                for row in table.rows
            ]
            text = "\n\n".join(
                part for part in [*paragraphs, *table_rows] if part
            ).strip()
            page_count = 0
        elif extension in {".txt", ".md", ".csv", ".tsv", ".json", ".log"}:
            text = raw_content.decode("utf-8-sig").strip()
            page_count = 0
        else:
            raise HTTPException(
                status_code=415,
                detail="Supported files: PDF, DOCX, TXT, Markdown, CSV, TSV, JSON, and LOG.",
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
            detail="Flow-AI could not extract readable text from this source. Scanned PDFs need OCR before import.",
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

@app.put("/api/workspace/ui-state", response_model=WorkspaceState)
async def update_ui_state(payload: UiStateUpdateRequest) -> WorkspaceState:
    state = load_state()
    if payload.ui_state is not None:
        state["ui_state"] = payload.ui_state.model_dump()
        save_state(state)
    return workspace_response(state)


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

    if payload and payload.ui_state is not None:
        state["ui_state"] = payload.ui_state.model_dump()

    append_snapshot(state, f"Checkpoint before restoring revision r{revision}")

    restored_state = copy.deepcopy(snapshot.get("state", {}))
    restored_state["snapshots"] = copy.deepcopy(state.get("snapshots", []))
    restored_state["revision"] = state.get("revision", 0)
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

    is_existing_topic = topic is not None
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
        '  "topic_fit": {"score": 82, "verdict": "aligned", "reason": "Short explanation"},\n'
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
        "compared, tree for hierarchy or parent-child structure, and graph for all other cases. "
        "When Existing verified findings are supplied, topic_fit must assess whether this source "
        "belongs to the same research question: use aligned only for direct topical fit, uncertain "
        "for ambiguous fit, and unrelated when the source is from a different domain. The verdict "
        "must be exactly aligned, uncertain, or unrelated. If the verdict is uncertain or unrelated, "
        "return an empty relations list for every proposal. Never force a relation merely because two "
        "quotes exist. The reason may use the requested response language."
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
        response = get_openai_client(payload.api_key).chat.completions.create(
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
        topic_fit = (
            normalize_topic_fit(
                result_data.get("topic_fit"),
                "The source-to-topic fit could not be determined reliably.",
            )
            if is_existing_topic
            else TopicFit(
                score=100,
                verdict="aligned",
                reason="This source establishes a new research topic.",
            )
        )
        source_policy = payload.source_policy
        is_confidently_aligned = (
            topic_fit.verdict == "aligned"
            and topic_fit.score >= TOPIC_FIT_ALIGNMENT_THRESHOLD
        )
        source_quarantined = is_existing_topic and (
            topic_fit.verdict == "unrelated"
            or topic_fit.score < TOPIC_FIT_QUARANTINE_THRESHOLD
            or (
                source_policy == "isolate_uncertain"
                and not is_confidently_aligned
            )
        )
        relations_allowed = (
            not is_existing_topic
            or (
                is_confidently_aligned
                and source_policy != "import_without_links"
            )
        )

        if source_quarantined:
            timestamp = utc_now()
            source_label = (payload.source_title or "Unrelated source").strip()
            isolation_label = (
                "Quarantined"
                if topic_fit.verdict == "unrelated"
                or topic_fit.score < TOPIC_FIT_QUARANTINE_THRESHOLD
                else "Review isolate"
            )
            topic = {
                "id": create_id("topic", len(state["topics"])),
                "title": f"{isolation_label}: {source_label}",
                "query": source_label,
                "created_at": timestamp,
                "updated_at": timestamp,
                "source_count": 0,
                "finding_count": 0,
                "suggested_layout": "graph",
            }
            state["topics"].append(topic)
            topic_id = topic["id"]
            topic_findings = []
            topic_finding_by_id = {}
            relations_allowed = False

        requested_layout = result_data.get("suggested_layout", "graph")
        suggested_layout = (
            requested_layout
            if requested_layout in VALID_LAYOUTS
            else "graph"
        )
        final_proposals = []
        candidate_proposals = result_data.get("proposals", [])
        if not isinstance(candidate_proposals, list):
            raise HTTPException(
                status_code=502,
                detail="OpenAI returned an invalid proposals structure.",
            )
        rejected_for_evidence = 0
        rejected_for_schema = 0
        source = {
            "id": create_id("source", len(state["sources"])),
            "topic_id": topic_id,
            "title": (payload.source_title or "Research document").strip(),
            "created_at": utc_now(),
            "character_count": len(payload.text),
            "page_count": max(payload.source_page_count, 0),
            "document_hash": document_hash(payload.text),
            "topic_fit_score": topic_fit.score,
            "topic_fit_status": topic_fit.verdict,
            "topic_fit_reason": topic_fit.reason,
            "source_policy": source_policy,
        }

        for index, proposal in enumerate(candidate_proposals):
            if not isinstance(proposal, dict):
                rejected_for_schema += 1
                continue
            proposal["id"] = create_id("prop", index)
            proposal.setdefault("commit_state", {})
            proposal["commit_state"].setdefault("revision", 1)
            proposal["commit_state"].setdefault("workspace", "Proposal")
            proposal["commit_state"]["updated_at"] = utc_now()
            proposal.setdefault("status", "Unidentified")
            proposal["confidence_score"] = normalize_confidence_score(
                proposal.get("confidence_score")
            )
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
                rejected_for_evidence += 1
                continue

            candidate_relations = []
            if relations_allowed:
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
                    relation["id"] = create_id("rel", index)
                    relation["origin"] = "ai"
                    relation["status"] = "candidate"
                    relation["confidence_score"] = normalize_confidence_score(
                        relation.get("confidence_score")
                    )
                    candidate_relations.append(relation)
            proposal["relations"] = candidate_relations

            try:
                validated_proposal = Finding(**proposal)
            except Exception:
                rejected_for_schema += 1
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

        warning = None
        if source_quarantined:
            warning = (
                f"Source isolated into a separate topic because its fit with the active topic "
                f"was {topic_fit.score}/100 ({topic_fit.verdict}). No cross-topic relations were created."
            )
        elif is_existing_topic and source_policy == "import_without_links":
            warning = (
                "Source was imported into the active topic without automatic AI relations, "
                "as requested by the import policy."
            )
        elif is_existing_topic and not relations_allowed:
            warning = (
                f"Source fit is {topic_fit.score}/100 ({topic_fit.verdict}), so Flow-AI kept its "
                "facts separate from existing facts and created no AI relations."
            )
        elif candidate_proposals and not final_proposals:
            warning = (
                "AI returned proposals, but none contained a quote that could be mapped "
                "back to the uploaded source. The source was saved; try a more focused "
                "excerpt or run the analysis again."
            )
        elif rejected_for_evidence or rejected_for_schema:
            warning = (
                f"Accepted {len(final_proposals)} evidence-grounded proposal(s); skipped "
                f"{rejected_for_evidence + rejected_for_schema} item(s) without valid source evidence."
            )

        return ResearchResponse(
            status="success" if warning is None else "completed_with_warnings",
            new_proposals=final_proposals,
            topic=ResearchTopic.model_validate(topic),
            warning=warning,
            topic_fit=topic_fit,
            source_quarantined=source_quarantined,
            suggested_layout=suggested_layout,
        )
    except HTTPException:
        raise
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
        response = get_openai_client(payload.api_key).chat.completions.create(
            model=MODEL_NAME,
            reasoning_effort="low",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(graph_input, ensure_ascii=False)},
            ],
            response_format={"type": "json_object"},
        )
        result = json.loads(extract_json(response.choices[0].message.content or "{}"))
    except HTTPException:
        raise
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

        confidence_score = normalize_confidence_score(
            candidate.get("confidence_score")
        )
        relation = Relation(
            target_id=target_id,
            type=relation_type,
            origin="ai",
            status="candidate",
            confidence_score=confidence_score,
            evidence=candidate.get("evidence"),
            reason=candidate.get("reason"),
        )
        source_finding.setdefault("relations", []).append(relation.model_dump())
        created_relations.append({"source_id": source_id, **relation.model_dump()})

    if created_relations:
        append_snapshot(
            state,
            f"Created {len(created_relations)} AI relation candidate(s) for review",
        )
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
    if relation_type not in ALLOWED_RELATION_TYPES:
        raise HTTPException(status_code=422, detail="Unsupported relation type")

    is_cross_topic = source_finding.get("topic_id") != target_finding.get("topic_id")
    if is_cross_topic:
        relation_type = "cross-topic hypothesis"

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
        status="hypothesis" if is_cross_topic else "verified",
        evidence=payload.evidence,
        reason=(
            payload.reason
            or (
                "Cross-topic hypothesis created manually. It is not an evidence-verified AI relation."
                if is_cross_topic
                else "Created manually on the graph canvas."
            )
        ),
    )
    source_finding.setdefault("relations", []).append(relation.model_dump())
    append_snapshot(
        state,
        (
            f"Created cross-topic hypothesis: {source_finding['title']}"
            if is_cross_topic
            else f"Created manual connection: {source_finding['title']}"
        ),
    )
    save_state(state)
    return {"status": "success", "relation": relation}

@app.post("/api/findings/{finding_id}/relations/{relation_id}/approve")
async def approve_ai_relation(finding_id: str, relation_id: str):
    state = load_state()
    source_finding = next(
        (finding for finding in state["findings"] if finding.get("id") == finding_id),
        None,
    )
    if source_finding is None:
        raise HTTPException(status_code=404, detail="Source finding not found")

    relation = next(
        (
            item
            for item in source_finding.get("relations", [])
            if item.get("id") == relation_id
        ),
        None,
    )
    if relation is None:
        raise HTTPException(status_code=404, detail="Relation not found")
    if relation.get("origin") != "ai" or relation.get("status") != "candidate":
        raise HTTPException(
            status_code=422,
            detail="Only pending AI relation candidates can be approved",
        )

    relation["status"] = "verified"
    append_snapshot(state, f"Approved AI relation from: {source_finding['title']}")
    save_state(state)
    return {"status": "success", "relation": relation}


@app.delete("/api/findings/{finding_id}/relations/{relation_id}")
async def delete_relation(finding_id: str, relation_id: str):
    state = load_state()
    source_finding = next(
        (finding for finding in state["findings"] if finding.get("id") == finding_id),
        None,
    )
    if source_finding is None:
        raise HTTPException(status_code=404, detail="Source finding not found")

    relations = source_finding.get("relations", [])
    relation = next((item for item in relations if item.get("id") == relation_id), None)
    if relation is None:
        raise HTTPException(status_code=404, detail="Relation not found")
    if relation.get("origin") != "manual" and relation.get("status") != "candidate":
        raise HTTPException(
            status_code=422,
            detail="Verified AI relations cannot be deleted from the canvas",
        )

    source_finding["relations"] = [
        item for item in relations if item.get("id") != relation_id
    ]
    action = (
        f"Rejected AI relation candidate from: {source_finding['title']}"
        if relation.get("status") == "candidate" and relation.get("origin") == "ai"
        else f"Removed manual connection from: {source_finding['title']}"
    )
    append_snapshot(state, action)
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

    supplied_fact_text = (request.fact_text or "").strip()
    if selected_fact:
        target_instruction = (
            "You are an AI Red Teamer. Critique only the targeted fact below. Attack its "
            "logic, unstated assumptions, evidentiary basis, missing context, and possible "
            "contradictions with the workspace. Do not drift into a generic workspace review.\n"
            f"Target fact ID: {selected_fact['id']}\n"
            f"Target fact title: {selected_fact['title']}\n"
            f"Target fact text: {selected_fact['details']}\n"
        )
    elif supplied_fact_text:
        target_instruction = (
            "You are an AI Red Teamer. Critique only the fact text supplied by the user "
            "interface below. Attack its logic, unstated assumptions, evidentiary basis, "
            "missing context, and possible contradictions with the workspace. Do not drift "
            "into a generic workspace review.\n"
            f"Target fact text: {supplied_fact_text}\n"
        )
    else:
        target_instruction = (
            "You are a Socratic Co-Pilot. Critique the entire workspace and identify its "
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
    if supplied_fact_text and not selected_fact:
        user_content += f"\n\nTarget fact supplied by the interface:\n{supplied_fact_text}"

    try:
        response = get_openai_client(request.api_key).chat.completions.create(
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
        hypothesis = result_data.get("proposed_hypothesis")
        if isinstance(hypothesis, dict):
            hypothesis["confidence_score"] = normalize_confidence_score(
                hypothesis.get("confidence_score")
            )
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
    evidence_quote = payload.evidence.strip()
    if not evidence_quote:
        raise HTTPException(
            status_code=422,
            detail="Socratic hypotheses require an exact evidence quote before they can be merged.",
        )

    matched_evidence = next(
        (
            copy.deepcopy(evidence)
            for existing_finding in state.get("findings", [])
            for evidence in existing_finding.get("evidence", [])
            if isinstance(evidence, dict) and evidence.get("quote") == evidence_quote
        ),
        None,
    )
    if matched_evidence is None:
        raise HTTPException(
            status_code=422,
            detail="Socratic hypothesis evidence must be an exact workspace quote.",
        )

    matched_evidence["id"] = create_id("ev")
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
        "confidence_score": payload.confidence_score,
        "commit_state": {
            "revision": int(state.get("revision", 0)) + 1,
            "workspace": "Committed",
            "updated_at": utc_now(),
        },
        "evidence": [matched_evidence],
        "relations": [],
        "topic_id": topic_id,
        "source_id": matched_evidence.get("source_id"),
        "source_title": matched_evidence.get("title") or "Socratic review",
    }
    state.setdefault("findings", []).append(finding)
    normalize_state(state)
    append_snapshot(state, f"Committed Socratic hypothesis: {finding['title']}")
    save_state(state)
    return {"status": "success", "committed_finding": finding}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
