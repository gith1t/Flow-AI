# Flow-AI: Spatial Research IDE & AI Red Teaming

**Track:** Developer Tools  
**Hackathon:** OpenAI Build Week (Codex & GPT-5.6)

Flow-AI turns research sources into an evidence-grounded spatial knowledge graph. It gives a researcher one canvas for extracting facts, seeing relationships, challenging assumptions, and preserving meaningful research revisions.

## The problem

Long research chats and static tables make it difficult to see how claims relate, which source supports each claim, and where a line of reasoning is weak. Valuable evidence becomes buried in a conversation instead of becoming reusable research structure.

## The solution

Flow-AI is a local-first Spatial Research IDE built around **Context Git**:

- ingest a paper, note, dataset, or document into a dedicated research topic;
- turn only evidence-backed claims into AI proposals;
- promote human-approved proposals into verified Fact Nodes;
- visualize topic trails, AI-discovered links, and manual causal links on one React Flow canvas;
- use a targeted Socratic Co-Pilot to red-team a selected fact and create a visible conflict branch;
- restore earlier research and canvas states with Time Travel.

The frontend never asks for an API key. The FastAPI backend owns the OpenAI connection through its local environment.

## Core capabilities

### Strict Evidence Mapping

Every finding must contain an exact quotation from the source text. The backend rejects model-generated evidence that cannot be found verbatim in the submitted document. Evidence can carry its source, character offsets, and PDF page number.

### Multi-topic research canvas

Each research question creates a Root Node. Add multiple papers or notes to the same topic, or create several topics on the same canvas. The Inbox is filtered by the active topic while the graph preserves the wider research picture.

### Knowledge graph connections

- automatic Root Node → Fact Node evidence trails;
- AI-discovered, evidence-backed relationships through **Discover Connections**;
- persistent manual Fact → Fact connections in Manual mode;
- visible red animated conflict edges from Socratic Drafts to the fact under review;
- Context Layers for grouping related facts.

### Socratic Co-Pilot

Select a Fact Node and run the Co-Pilot. It acts as a Red Teamer against that specific fact: logic, hidden assumptions, evidence quality, and missing context. The result appears as a Draft Branch that can be **Resolve & Merge**d or rejected.

### Smart layouts and Time Travel

The backend suggests one of four structures from the source: **Graph**, **Tree**, **Timeline**, or **Comparison**. Magic Layout places the nodes deterministically for that structure. Every meaningful backend change creates a revision. Restoring a revision brings back findings, relationships, absolute node positions, Context Layers, local manual edges, and layout mode.

### Source ingestion and reporting

The Spotlight Ingestion modal accepts **PDF, TXT, Markdown, CSV, and JSON**. PDF text is extracted page-by-page for evidence mapping. Use **Download Report** to export verified findings and their evidence as Markdown.

## Architecture

| Layer | Technology | Responsibility |
|---|---|---|
| Client | React 19, Vite, Tailwind CSS, `@xyflow/react` | Spatial graph, Inspector, Ingestion, layouts, local canvas state |
| API | FastAPI, Pydantic | Research workflow, strict evidence validation, workspace revisions, file extraction |
| Model | `gpt-5.6-luna` with `reasoning_effort="low"` | Fact proposals, layout suggestions, relationship discovery, targeted Red Teaming |
| Persistence | Local `workspace_state.json` | Findings, topics, sources, graph relationships, history snapshots |

Codex was used as the implementation partner for the React Flow interaction model, FastAPI/Pydantic contracts, layout behavior, and verification workflow.

## Setup for judges

### Prerequisites

- Node.js **20.19+** or **22.12+**
- Python 3.10+
- An OpenAI API key with access to `gpt-5.6-luna`

### 1. Configure and start the backend

Create `backend/.env`. This file is ignored by Git.

```env
OPENAI_API_KEY=your_openai_api_key
```

macOS / Linux:

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Windows PowerShell:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API runs at `http://localhost:8000`.

### 2. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Demo flow

1. Press `Ctrl+K` / `Cmd+K`, click the Flow-AI logo, or select **+ New topic**.
2. Enter an Active Query and paste research text, or import a PDF, TXT, MD, CSV, or JSON file.
3. Click **Analyze Research**. Flow-AI creates a topic and evidence-backed proposals.
4. Inspect a proposal in the AI Inbox, then choose **Merge to Workspace** to create a verified Fact Node.
5. Use **+ Add paper** on the topic root to add a second source and expand the same research question.
6. Press **Discover Connections** to ask the AI for evidence-grounded links between verified facts. Switch to **Manual** to draw your own Fact → Fact links.
7. Click a Fact Node, then run **Context Co-Pilot**. Inspect the red conflict edge and choose **Resolve & Merge** or **Reject Attack** on the Draft Branch.
8. Group related nodes into a Context Layer. Try Graph, Tree, Timeline, Comparison, and **Magic Layout**.
9. Open Inspector → History and restore a revision to demonstrate Time Travel.
10. Use **Download Report** to export the verified findings as Markdown.

## Local constraints

- The file extraction endpoint accepts files up to 12 MB.
- PDF extraction uses the embedded text layer. Scanned image-only PDFs need OCR before ingestion.
- Workspace data is local to the backend process through `workspace_state.json`.

## Verification

The project is checked with:

```bash
cd frontend
npm run build
npm run lint
```

```bash
python -m py_compile backend/main.py
```
