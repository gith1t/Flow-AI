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
- visualize topic trails, reviewable AI relation candidates, verified links, and manual hypotheses on one React Flow canvas;
- use a targeted Socratic Co-Pilot to red-team a selected fact and create a visible conflict branch;
- restore earlier research and canvas states with Time Travel.

The selected response language also localizes the interface. **Auto** follows the language of the imported source document; explicit English or Ukrainian selection applies to the UI, AI findings, Socratic review, and relation labels.

The Spotlight Ingestion modal accepts a session-only OpenAI key. It is sent only to the local AI request at `localhost:8000`, is never written to disk or browser storage, and disappears when the page is reloaded. A manually created `backend/.env` key remains an optional local fallback.

## Core capabilities

### Strict Evidence Mapping

Every finding must contain a source-grounded quotation. The backend stores the exact fragment from the submitted document, including its character offsets and PDF page number. It tolerates only presentation differences introduced by PDF extraction or the model—line wrapping, whitespace, typographic quotes, and dash variants—while rejecting unsupported semantic rewrites.

### Multi-topic research canvas

Each research question creates a Root Node. Add multiple papers or notes to the same topic, or create several topics on the same canvas. Before a new source can affect an existing topic, **Relation Firewall** asks the model for a Topic Fit score and verdict. For an added source, choose a policy: Smart Firewall, isolate uncertain sources, or import facts without AI links. An unrelated source is always quarantined into its own topic. The Inbox is filtered by the active topic while the graph preserves the wider research picture. Delete Topic removes that topic’s sources, proposals, facts, links, and canvas records; an earlier revision remains recoverable from History.

### Knowledge graph connections

- automatic Root Node → Fact Node evidence trails;
- AI-discovered, evidence-backed relationships through **Discover Connections**, initially shown as yellow review candidates;
- human approval or rejection for every AI relation candidate in the selected Fact’s Inspector;
- persistent manual Fact → Fact connections in Manual mode; manual links between separate topics are explicitly labelled **Cross-topic hypothesis**, never as evidence-verified AI claims;
- visible red animated conflict edges from Socratic Drafts to the fact under review;
- Context Layers for grouping related facts.

Click any relationship edge to open its **Relation Inspector**: source and target facts, status, origin, confidence, exact evidence, and rationale are visible in one place. The Graph Filters panel can focus the active topic, search findings, filter by source or confidence, and toggle evidence trails, reviewed links, candidates, manual hypotheses, and Red Team branches.

### Socratic Co-Pilot

Select a Fact Node and run the Co-Pilot. It acts as a Red Teamer against that specific fact: logic, hidden assumptions, evidence quality, and missing context. The result appears as a Draft Branch that can be **Resolve & Merge**d or rejected.

### Smart layouts and Time Travel

The backend suggests one of four structures from the source: **Graph**, **Tree**, **Timeline**, or **Comparison**. Magic Layout places the nodes deterministically for that structure. Every meaningful backend change creates a revision. Restoring a revision brings back findings, relationships, absolute node positions, Context Layers, local manual edges, and layout mode. Local state uses an atomic write with a backup file, so an interrupted write does not silently reset a workspace.

### Source ingestion and reporting

The Spotlight Ingestion modal accepts **PDF, DOCX, TXT, Markdown, CSV, TSV, JSON, and LOG**. PDF text is extracted page-by-page for evidence mapping, while DOCX is extracted locally by the backend. Use **Download Report** to export verified findings and their evidence as Markdown.

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

### 1. One-command startup (recommended)

From the project root, run this single command.

```powershell
powershell -ExecutionPolicy Bypass -File .\start-flow-ai.ps1
```

The script creates `backend\venv` when needed, installs missing dependencies, starts FastAPI first, waits for port `8000`, then starts Vite on port `5173` and opens the browser. Press `Ctrl+C` in the same terminal to stop both services. Use `-NoBrowser` to skip opening a tab or `-SkipInstall` to fail fast instead of installing missing dependencies. Each run writes backend and frontend logs to `.flow-ai-logs\`.

The backend starts without a key so source extraction remains available. Paste a session-only OpenAI key into Spotlight Ingestion before AI analysis, or create `backend/.env` for an optional local fallback. The `.env` file is ignored by Git.

```env
OPENAI_API_KEY=your_openai_api_key
```

### 2. Manual startup (optional)

If you need separate terminals or live service output, start the backend first:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Then open a second terminal for the frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Demo flow

1. Press `Ctrl+K` / `Cmd+K`, click the Flow-AI logo, or select **+ New topic**.
2. Choose the response language in Spotlight Ingestion, paste an OpenAI key into the session-only connection field, then enter an Active Query and paste research text or import a PDF, DOCX, TXT, MD, CSV, TSV, JSON, or LOG file.
3. Click **Analyze Research**. Flow-AI creates a topic and evidence-backed proposals.
4. Inspect a proposal in the AI Inbox, then choose **Merge to Workspace** to create a verified Fact Node.
5. Use **+ Add paper** on the topic root to add a second source and expand the same research question.
6. Merge at least two proposals in a topic, then press **Discover Connections** to ask the AI for evidence-grounded links between verified facts. Select the source Fact and approve or reject each yellow relation candidate in Inspector. Switch to **Manual** to draw your own Fact → Fact links; cross-topic links remain labelled hypotheses. **Review** runs the Socratic Co-Pilot, and **Magic** applies the active layout.
7. Click a graph edge to inspect its source, target, status, rationale, confidence, and exact evidence. Use Graph Filters to focus the active topic or simplify the graph.
8. Click a Fact Node, then run **Context Co-Pilot**. Inspect the red conflict edge and choose **Resolve & Merge** or **Reject Attack** on the Draft Branch.
9. Group related nodes into a Context Layer. Try Graph, Tree, Timeline, Comparison, and **Magic Layout**.
10. Open Inspector → History and restore a revision to demonstrate Time Travel.
11. Use **Download Report** to export the verified findings as Markdown.

Use **Start fresh workspace** in Spotlight Ingestion when you want to discard old test topics, findings, graph links, and Time Travel history before a clean demo run.

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
python -m unittest discover -s backend/tests -p "test_*.py" -v
```
