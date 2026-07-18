# Flow-AI: Spatial Research IDE & AI Red Teaming 🧠🕸️

**Track:** Developer Tools  
**Hackathon:** OpenAI Build Week (Codex & GPT-5.6)

## 📌 The Problem
Modern AI research tools (like NotebookLM) trap information in "kilometer-long chats" where data dies. Furthermore, static templates (Kanban, Tables) don't scale. Researchers and developers need a spatial environment where AI not only extracts knowledge but actively stress-tests it.

## 💡 The Solution
Flow-AI is a spatial IDE that turns static documents into a dynamic, interactive Knowledge Graph. Instead of just summarizing, our **Socratic Co-Pilot** acts as an AI Red Teamer. You can click on any extracted fact, and the Co-Pilot will attack its logic, unstated assumptions, and evidentiary basis, drawing red conflict lines right on the canvas. 

Furthermore, Flow-AI features **Smart Layout Inference**: the backend AI automatically decides the best way to visualize the data (Graph, Tree, Timeline, or Comparison) based on the content's structure.

## 🤖 How We Built It (Codex + GPT-5.6)

This project heavily leverages the OpenAI ecosystem:

* **Codex (The Architect):** We used Codex via the ChatGPT UI as our Senior React/Python Engineer. Codex generated the complex mathematical logic for our `React Flow` radial and tree layouts (`applyMagicLayout`), handled state synchronization across the UI, and wrote the strict `Pydantic` schemas for our FastAPI backend.
* **GPT-5.6 (The Core Engine):** Powers the backend analysis. It reads the source documents, extracts `FactNodes`, determines the `suggested_layout`, and runs the targeted Red Teaming prompts for the Socratic Co-Pilot.

## ⚙️ Setup Instructions for Judges

### Prerequisites
* Node.js (v18+)
* Python 3.10+
* OpenAI API Key

### 1. Start the Backend (FastAPI)
\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
# Set your OPENAI_API_KEY in backend/.env
uvicorn main:app --reload --port 8000
\`\`\`

### 2. Start the Frontend (Vite + React)
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`
The app will be running at `http://localhost:5173`.

## 🧪 How to Test the Project
1. Open the UI and press `Ctrl+K` (or click the "F" logo) to open the **Spotlight Ingestion** modal.
2. Click **"Import source file"** and upload a `.txt` or `.md` file (e.g., a technical paper or documentation).
3. Click **Analyze Research**. Watch GPT-5.6 extract the facts and automatically organize them into a Tree or Graph.
4. **The Magic:** Click on any green `Fact Node` on the canvas to select it.
5. Click **"Запустити Context Co-Pilot"** (Run Context Co-Pilot) in the TopBar. 
6. Watch as the AI Red Teamer attacks that specific fact, creating a red `Draft` node with critical questions and logical gaps.
7. Try switching between **Graph** and **Tree** modes in the TopBar to see the math in action.
