# Flow-AI Research IDE

> An evidence-grounded spatial workspace that turns papers and notes into a traceable research graph.

**OpenAI Build Week track:** Developer Tools
**Repository:** [gith1t/Flow-AI](https://github.com/gith1t/Flow-AI)

## The idea

Research teams need more than an AI summary. They need to know:

- which claims were extracted;
- which exact passage supports each claim;
- how verified claims relate to one another;
- what changed in the workspace over time.

Flow-AI answers these questions in one local-first canvas. AI proposals stay separate from human-approved findings, every finding keeps source evidence, and relationships remain reviewable instead of being invented silently.

## What the demo shows

- Import PDF, DOCX, TXT, Markdown, CSV, TSV, JSON, or LOG sources.
- Create a research topic and extract evidence-backed proposals.
- Review confidence scores and exact quotations in the AI Inbox.
- Merge approved facts into a React Flow knowledge graph.
- Discover evidence-grounded relationships while isolating unrelated sources.
- Use Context Co-Pilot for targeted questions and hypothesis drafts.
- Group facts, switch Graph/Tree/Timeline/Comparison layouts, and restore previous UI snapshots.
- Download a Markdown report containing verified findings and evidence.

## Technology

- React 19, Vite 8, Tailwind CSS, `@xyflow/react`
- FastAPI, Uvicorn, Pydantic
- OpenAI Python SDK with `gpt-5.6-luna`
- PDF/DOCX extraction with `pypdf` and `python-docx`
- Local persistence in `workspace_state.json`

## Run locally

Requirements: Python 3.10+, Node.js 20.19+ (or 22.12+), and an OpenAI API key with access to the configured model.

### Windows — one command

From the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-flow-ai.ps1
```

The launcher creates the backend environment, installs missing dependencies, starts FastAPI on `http://localhost:8000`, starts Vite on `http://localhost:5173`, and opens the browser.

Useful options:

```powershell
.\start-flow-ai.ps1 -NoBrowser
.\start-flow-ai.ps1 -SkipInstall
```

### macOS/Linux — two terminals

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

Open `http://localhost:5173`.

## OpenAI key

The app can extract files without a key. For AI analysis, either paste a session-only key in Spotlight Ingestion or copy [`backend/.env.example`](backend/.env.example) to `backend/.env` and add `OPENAI_API_KEY`.

Session keys are used only for the current browser session and are not written to local storage. Never commit a real key.

## Fast demo path

1. Start the project.
2. Open Spotlight Ingestion and select **Auto**, **English**, or **Ukrainian**.
3. Enter a query and upload [`demo/sample_research.md`](demo/sample_research.md), or use your own permitted source.
4. Analyze the source, inspect evidence in **AI Inbox**, and merge proposals.
5. Merge two or more facts and run **Discover Connections**.
6. Select a fact and run **Context Co-Pilot**.
7. Try a layout, group facts, restore a previous revision, and download the report.

## Codex and GPT-5.6

Codex was the primary coding agent for the React Flow canvas, FastAPI/Pydantic contracts, evidence validation, topic isolation, localization, UI-state snapshots, regression checks, and the one-command launcher.

GPT-5.6 (`gpt-5.6-luna`) generates structured findings, confidence scores, topic-fit decisions, layout suggestions, relationship candidates, and Socratic drafts. Human approval remains required before proposals or relationships become part of the verified workspace.

## Devpost checklist

The Devpost submission must include:

- a public YouTube demo shorter than three minutes, with audio explaining the product and the use of Codex and GPT-5.6;
- the public repository URL and submitted branch;
- the Codex Session ID from `/feedback` in the primary build task;
- an English project description, README, and video narration (or English translation).

Keep API keys, private documents, runtime logs, and the Codex Session ID out of Git. The synthetic demo source is included so judges can test the full flow without rebuilding the app.

## Verification

```powershell
cd frontend
npm run lint
npm run build

python -m py_compile backend/main.py
python -m unittest discover -s backend/tests -p "test_*.py" -v
```

## Current scope

This is a local-first hackathon MVP. Hosted multi-user persistence, authentication, OCR for image-only PDFs, and production job queues are outside the current scope.

## License

[MIT](LICENSE)
