import { useState } from "react";

// Yomirai Lean MVP — Flow-AI Research IDE (frontend stub).
// NOTE: Replace this component with the full React code you provided in chat.
// This runnable stub wires the UI to the real FastAPI backend on localhost:8000
// so the scaffold is testable end-to-end before you paste the final component.

const API = "http://localhost:8000";

export default function App() {
  const [query, setQuery] = useState("");
  const [text, setText] = useState("");
  const [workspace, setWorkspace] = useState({ findings: [], proposals: [] });
  const [proposals, setProposals] = useState([]);
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function loadWorkspace() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`${API}/api/workspace`);
      const data = await r.json();
      setWorkspace(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function runResearch() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`${API}/api/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, text }),
      });
      const data = await r.json();
      setProposals(data.new_proposals || []);
      await loadWorkspace();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function commitProposal(id) {
    setBusy(true);
    setError(null);
    try {
      await fetch(`${API}/api/proposals/${id}/commit`, { method: "POST" });
      await loadWorkspace();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function socraticReview() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`${API}/api/socratic/review`, { method: "POST" });
      const data = await r.json();
      setDraft(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleAcceptHypothesis() {
    if (!draft?.proposed_hypothesis) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`${API}/api/socratic/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft.proposed_hypothesis),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setDraft(null);
      await loadWorkspace();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  function renderHypothesis(hypothesis) {
    if (!hypothesis) return null;
    return (
      <div className="mt-2">
        <div className="font-medium">{hypothesis.title}</div>
        <div className="text-xs text-slate-400">{hypothesis.details}</div>
        <div className="text-xs text-amber-300 mt-1">
          Confidence: {hypothesis.confidence_score}
        </div>
        {hypothesis.evidence && (
          <p className="mt-1 text-xs italic text-slate-300">
            &ldquo;{hypothesis.evidence}&rdquo;
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <h1 className="text-2xl font-bold mb-4">Yomirai — Flow-AI Research IDE</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800 p-4 rounded-lg">
          <label className="block text-sm mb-1">Query</label>
          <input
            className="w-full bg-slate-700 rounded p-2 mb-3"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Research query"
          />
          <label className="block text-sm mb-1">Text / Lecture</label>
          <textarea
            className="w-full bg-slate-700 rounded p-2 h-32"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste source text..."
          />
          <div className="mt-3 flex gap-2">
            <button
              className="bg-indigo-600 px-3 py-2 rounded disabled:opacity-50"
              onClick={runResearch}
              disabled={busy}
            >
              Research
            </button>
            <button
              className="bg-emerald-600 px-3 py-2 rounded disabled:opacity-50"
              onClick={socraticReview}
              disabled={busy}
            >
              Socratic Review
            </button>
            <button
              className="bg-slate-600 px-3 py-2 rounded disabled:opacity-50"
              onClick={loadWorkspace}
              disabled={busy}
            >
              Reload
            </button>
          </div>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Workspace</h2>
          <p className="text-xs text-slate-400 mb-2">
            Findings: {workspace.findings?.length || 0} | Proposals:{" "}
            {workspace.proposals?.length || 0}
          </p>
          <pre className="text-xs bg-slate-900 p-2 rounded overflow-auto max-h-64">
            {JSON.stringify(workspace, null, 2)}
          </pre>
        </div>
      </div>

      {proposals.length > 0 && (
        <div className="mt-4 bg-slate-800 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">New Proposals</h2>
          {proposals.map((p) => (
            <div key={p.id} className="border border-slate-700 p-2 rounded mb-2">
              <div className="font-medium">{p.title}</div>
              <div className="text-xs text-slate-400">{p.details}</div>
              <button
                className="mt-1 bg-amber-600 px-2 py-1 rounded text-xs"
                onClick={() => commitProposal(p.id)}
                disabled={busy}
              >
                Commit
              </button>
            </div>
          ))}
        </div>
      )}

      {draft && (
        <div className="mt-4 bg-yellow-900/40 border border-yellow-700 p-4 rounded-lg">
          <h2 className="font-semibold mb-2 text-yellow-300">
            Draft Branch (Context Git)
          </h2>
          <p className="text-sm">
            <span className="text-rose-400">Gap:</span> {draft.identified_gap}
          </p>
          <ul className="list-disc list-inside text-sm my-2">
            {draft.socratic_questions?.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
          {renderHypothesis(draft.proposed_hypothesis)}
          <button
            className="mt-3 bg-emerald-600 hover:bg-emerald-500 px-3 py-2 rounded text-sm font-medium disabled:opacity-50"
            onClick={handleAcceptHypothesis}
            disabled={busy}
          >
            Accept &amp; Merge Hypothesis
          </button>
        </div>
      )}

      {error && <p className="mt-4 text-rose-400 text-sm">Error: {error}</p>}
    </div>
  );
}
