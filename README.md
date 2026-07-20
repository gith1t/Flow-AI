# Flow-AI Research IDE

> An evidence-grounded spatial research workspace for turning papers, notes, and datasets into a traceable knowledge graph.

**Hackathon track:** Developer Tools
**Product:** Flow-AI Research IDE
**Core idea:** Context Git — every AI-generated claim stays connected to its source evidence, human decisions, graph relationships, and recoverable workspace revisions.

## The pitch

Research tools usually force people to choose between a long chat, a spreadsheet, or a static note. None of those formats makes it easy to answer four questions at the same time:

1. What claims did the AI extract?
2. Which exact source passage supports each claim?
3. How do the verified claims relate to one another?
4. What changed in the research workspace over time?

Flow-AI provides one local-first canvas for that workflow. It separates unverified AI proposals from human-approved findings, maps every finding back to evidence, discovers reviewable relationships, and keeps the graph state versioned.

## What the demo shows

- **Spotlight Ingestion:** import PDF, DOCX, TXT, Markdown, CSV, TSV, JSON, or LOG sources.
- **Evidence-backed proposals:** the AI returns findings only when their quotations can be mapped back to the submitted source.
- **AI Inbox:** inspect proposals, confidence scores, details, and exact evidence before merging.
- **Verified Workspace:** promote approved proposals into Fact Nodes on a React Flow canvas.
- **Relation Firewall:** score a new source against the active research topic and isolate unrelated material instead of forcing connections.
- **Connection discovery:** generate evidence-grounded relationship candidates, then approve or reject them as a researcher.
- **Manual graph editing:** connect facts directly; cross-topic manual links are labelled as hypotheses rather than verified AI evidence.
- **Socratic Co-Pilot:** select a fact, inspect its logical gap and questions, then resolve or dismiss the resulting review draft.
- **Context Layers:** group related facts into visual layers without losing their persisted absolute positions.
- **Smart layouts:** switch between Graph, Tree, Timeline, and Comparison, or use Magic Layout.
- **Time Travel:** restore findings, relationships, node positions, context layers, manual edges, and layout mode from a previous revision.
- **Localized experience:** Auto follows the imported source language; explicit English or Ukrainian selection applies to the UI and AI output.
- **Cyber Report:** download verified findings and their evidence as Markdown.

## Why it is useful

Flow-AI is designed for research where provenance matters. The graph is not just a visual decoration: it is a working map of claims, evidence, confidence, relationships, review decisions, and revisions. The researcher remains in control of what becomes an official finding and what becomes a durable relationship.

## Technology stack

| Area | Technology | Role |
|---|---|---|
| Client | React 19, Vite 8, Tailwind CSS 3.4 | SPA shell, ingestion modal, graph UI, Inspector, localization |
| Graph | `@xyflow/react` 12 | Fact Nodes, Draft Nodes, Context Layers, handles, edges, minimap, controls |
| API | FastAPI, Uvicorn, Pydantic | Research workflow, validation, evidence mapping, relations, snapshots |
| AI | OpenAI Python SDK, configured model `gpt-5.6-luna` | Findings, layout suggestion, topic fit, relation candidates, Socratic review |
| Extraction | `pypdf`, `python-docx`, `python-multipart` | PDF/DOCX/text file ingestion and page-aware source extraction |
| Persistence | Local `workspace_state.json` | Topics, sources, proposals, findings, relations, UI state, history |

The client is a pure Vite React SPA. Requests go directly to `http://localhost:8000`.

## Requirements

- Windows PowerShell for the one-command launcher.
- Node.js **20.19+** or **22.12+**.
- Python **3.10+**.
- An OpenAI API key with access to the model configured in `backend/main.py` (`gpt-5.6-luna`).

## Start the project

### Recommended: one command on Windows

Run this from the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-flow-ai.ps1
```

The launcher:

1. checks `backend` and `frontend`;
2. creates `backend\venv` if it does not exist;
3. installs missing backend dependencies from `backend\requirements.txt`;
4. installs frontend dependencies when `frontend\node_modules` is missing;
5. starts FastAPI on `http://localhost:8000`;
6. waits until port `8000` is reachable;
7. starts Vite on `http://localhost:5173`;
8. opens the browser and keeps both services alive until `Ctrl+C`.

Useful options:

```powershell
.\start-flow-ai.ps1 -NoBrowser
.\start-flow-ai.ps1 -SkipInstall
```

Runtime logs are written to `.flow-ai-logs\`, which is ignored by Git.

### Manual startup

Use this when you need separate terminals or visible service output.

Backend terminal:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

Frontend terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` after both processes are running.

### macOS/Linux manual startup

Backend:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## OpenAI key and local security

The application can start without a key so local file extraction remains available.

For AI analysis, use either:

1. the session-only key field in Spotlight Ingestion; or
2. an optional `backend/.env` file:

```env
OPENAI_API_KEY=your_openai_api_key
```

Session keys are sent only to the local FastAPI request, are not stored in `localStorage`, and disappear after the browser session. `backend/.env` is ignored by Git. Never commit a real API key.

## Demo flow for judges

1. Start the project with `start-flow-ai.ps1`.
2. If old test data is present, open Spotlight Ingestion and choose **Start fresh workspace**.
3. Select **Auto**, **English**, or **Ukrainian** response language.
4. Paste a session key if `backend/.env` is not configured.
5. Enter an Active Query and import a source file or paste source text.
6. Click **Analyze Research**. A topic root and evidence-backed AI proposals appear.
7. Select a proposal in **AI Inbox**, inspect its evidence, and click **Merge to Workspace**.
8. Add another paper to the same topic to demonstrate multi-source research.
9. Merge at least two facts, then click **Discover Connections**. Review the yellow candidates in Inspector and approve or reject them.
10. Switch to **Manual** to draw a direct Fact → Fact link.
11. Select a Fact Node and run **Context Co-Pilot**. Review the identified gap, questions, evidence, and proposed hypothesis; resolve and merge or dismiss the draft.
12. Try **Graph**, **Tree**, **Timeline**, **Comparison**, and **Magic Layout**.
13. Group facts into a Context Layer, then inspect **History** and restore a previous revision.
14. Click **Download Report** to export verified findings and source evidence as Markdown.

## API surface

The frontend talks directly to these FastAPI routes:

| Route | Purpose |
|---|---|
| `GET /api/workspace` | Load topics, sources, proposals, findings, UI state, and history |
| `GET /api/config/openai` | Check whether a backend key is configured |
| `POST /api/sources/extract` | Extract text and page metadata from an uploaded source |
| `POST /api/research` | Analyze a source and create proposals/topic data |
| `POST /api/proposals/{id}/commit` | Merge one proposal into verified findings |
| `POST /api/topics/{id}/relations/discover` | Generate evidence-grounded relation candidates |
| `POST /api/findings/{id}/relations` | Create a manual relationship |
| `POST /api/findings/{id}/relations/{relation_id}/approve` | Approve an AI relation candidate |
| `DELETE /api/findings/{id}/relations/{relation_id}` | Reject or remove a relation |
| `POST /api/socratic/review` | Generate a targeted Socratic review draft |
| `POST /api/socratic/commit` | Merge a reviewed hypothesis as a finding |
| `PUT /api/workspace/ui-state` | Persist positions, layers, manual edges, and layout |
| `POST /api/workspace/checkout/{revision}` | Restore a workspace revision |
| `POST /api/workspace/reset` | Clear the local workspace for a clean demo |

Important request fields include `target_lang`, `fact_id`, `fact_text`, `source_policy`, and `suggested_layout`. The backend validates evidence quotes before a proposal or hypothesis can be committed.

## Source formats and constraints

- Supported files: PDF, DOCX, TXT, Markdown, CSV, TSV, JSON, and LOG.
- Maximum upload size: 12 MB.
- PDF extraction uses the embedded text layer and preserves page information.
- Scanned image-only PDFs require OCR before import.
- Workspace persistence is local to the backend process in `workspace_state.json` with an atomic backup write.
- This is a local-first hackathon MVP, not a multi-user hosted service.

## Verification

Frontend checks:

```powershell
cd frontend
npm run lint
npm run build
```

Backend checks:

```powershell
python -m py_compile backend/main.py
python -m unittest discover -s backend/tests -p "test_*.py" -v
```

The backend tests cover the frontend/API contract, source extraction, target language prompts, confidence scores, relation approval/rejection, Socratic review, topic isolation, UI state persistence, and Time Travel restoration.

## Current scope

Flow-AI is intentionally local-first for the hackathon. Authentication, hosted multi-user persistence, OCR, production observability, and asynchronous job queues are outside the current MVP scope.

## License

See [LICENSE](LICENSE).
