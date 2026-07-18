import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addEdge,
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const API_URL = "http://localhost:8000";

const FactNode = memo(function FactNode({ data, selected }) {
  return (
    <div
      className={`min-w-60 rounded-xl border bg-slate-900/95 px-4 py-3 shadow-xl shadow-cyan-950/40 transition ${
        selected
          ? "border-cyan-300 ring-2 ring-cyan-400/40"
          : "border-emerald-500/70 hover:border-cyan-400"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !border-2 !border-slate-950 !bg-cyan-400"
      />
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-300">
          Verified Fact
        </span>
        <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
          Verified
        </span>
      </div>
      <p className="max-w-64 text-sm font-semibold leading-5 text-slate-100">
        {data.finding.title}
      </p>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !border-2 !border-slate-950 !bg-emerald-400"
      />
    </div>
  );
});

const DraftNode = memo(function DraftNode({ data, selected }) {
  const mergeBranch = (event) => {
    event.stopPropagation();
    data.onMerge();
  };

  const rejectAttack = (event) => {
    event.stopPropagation();
    data.onReject();
  };

  return (
    <div
      className={`min-w-80 rounded-xl border-2 border-dashed border-yellow-500 bg-slate-900/95 p-4 shadow-xl shadow-yellow-950/30 transition ${
        selected ? "ring-2 ring-yellow-400/45" : ""
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !border-2 !border-slate-950 !bg-yellow-400"
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-yellow-300">
            Red Team Branch
          </p>
          <h3 className="mt-1 text-sm font-bold text-yellow-100">Socratic Draft</h3>
        </div>
        <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-extrabold text-slate-950">
          Attack
        </span>
      </div>

      <p className="mt-3 text-sm font-semibold leading-5 text-slate-100">
        {data.draft.proposed_hypothesis.title}
      </p>
      <p className="mt-1 text-xs font-medium text-yellow-300/85">
        Critiques: {data.targetTitle || "workspace assumptions"}
      </p>
      <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-400">
        {data.draft.identified_gap}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={mergeBranch}
          disabled={data.isMerging}
          className="rounded-lg bg-yellow-400 px-3 py-2 text-xs font-extrabold text-slate-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {data.isMerging ? "Merging..." : "Resolve & Merge"}
        </button>
        <button
          type="button"
          onClick={rejectAttack}
          disabled={data.isMerging}
          className="rounded-lg border border-rose-400/60 px-3 py-2 text-xs font-bold text-rose-300 transition hover:bg-rose-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Reject Attack
        </button>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !border-2 !border-slate-950 !bg-yellow-400"
      />
    </div>
  );
});

const ContextLayerNode = memo(function ContextLayerNode({ data, selected }) {
  return (
    <div
      className={`h-full w-full rounded-2xl border-2 border-dashed bg-cyan-400/[0.035] p-4 transition ${
        selected
          ? "border-cyan-300 ring-2 ring-cyan-400/30"
          : "border-cyan-500/35"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-cyan-400">
            Context Layer
          </p>
          <p className="mt-1 text-sm font-bold text-cyan-100">{data.label}</p>
        </div>
        <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-[10px] font-extrabold text-cyan-300">
          {data.memberCount} facts
        </span>
      </div>
    </div>
  );
});

const RootNode = memo(function RootNode({ data, selected }) {
  const openIngestion = (event) => {
    event.stopPropagation();
    data.onOpenIngest();
  };

  return (
    <div
      className={`min-w-72 rounded-2xl border bg-slate-900/95 p-4 shadow-2xl shadow-cyan-950/50 transition ${
        selected
          ? "border-cyan-300 ring-2 ring-cyan-400/40"
          : "border-cyan-500/80"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !border-2 !border-slate-950 !bg-cyan-400"
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-cyan-400">
            Research Root
          </p>
          <p className="mt-1 max-w-56 text-sm font-bold leading-5 text-white">
            {data.root.title}
          </p>
        </div>
        <span className="rounded-lg bg-cyan-400 px-2 py-1 text-xs font-black text-slate-950">
          F
        </span>
      </div>
      <button
        type="button"
        onClick={openIngestion}
        className="mt-4 rounded-lg border border-cyan-400/50 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-200 transition hover:bg-cyan-400 hover:text-slate-950"
      >
        Edit research object
      </button>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !border-2 !border-slate-950 !bg-cyan-400"
      />
    </div>
  );
});

function TopBar({
  activeMode,
  setActiveMode,
  layoutMode,
  setLayoutMode,
  onLayoutChange,
  onOpenIngest,
  onRunCopilot,
  onMagicLayout,
  onDownloadReport,
  isReviewing,
  error,
}) {
  const modes = [
    { id: "manual", label: "● Manual" },
    { id: "review", label: "◉ Review" },
    { id: "magic", label: "✦ Magic" },
  ];

  const handleModeChange = (mode) => {
    setActiveMode(mode);

    if (mode === "review") {
      onRunCopilot();
    }

    if (mode === "magic") {
      onMagicLayout();
    }
  };

  const changeLayout = (mode) => {
    setLayoutMode(mode);
    onLayoutChange(mode);
  };

  return (
    <header className="border-b border-slate-800 bg-[#0B1120]/95 px-4 py-3 backdrop-blur-xl sm:px-6">
      <div className="mx-auto flex max-w-[1920px] flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <button
          type="button"
          onClick={onOpenIngest}
          className="flex items-center gap-3 self-start rounded-xl text-left outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-cyan-400 xl:self-auto"
          aria-label="Open research ingestion"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400 text-lg font-black text-slate-950 shadow-lg shadow-cyan-500/20">
            F
          </span>
          <span>
            <span className="block text-base font-bold tracking-tight text-white">
              Flow-AI IDE
            </span>
            <span className="mt-0.5 block text-xs font-medium text-emerald-400">
              • gpt-5.6-sol - Syncing workspace
            </span>
          </span>
        </button>

        <div className="flex flex-col items-start gap-2 xl:items-center">
          <div
            className="inline-flex rounded-xl border border-slate-700 bg-slate-950/70 p-1"
            role="group"
            aria-label="Workspace mode"
          >
            {modes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleModeChange(mode.id)}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                  activeMode === mode.id
                    ? "border border-slate-600 bg-slate-800 text-cyan-300 shadow-inner"
                    : "border border-transparent text-slate-500 hover:text-slate-200"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <div
            className="inline-flex rounded-lg border border-slate-800 bg-slate-950/70 p-0.5"
            role="group"
            aria-label="Graph layout mode"
          >
            <button
              type="button"
              onClick={() => changeLayout("graph")}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                layoutMode === "graph"
                  ? "bg-cyan-400 text-slate-950"
                  : "text-slate-500 hover:text-slate-200"
              }`}
            >
              Graph
            </button>
            <button
              type="button"
              onClick={() => changeLayout("tree")}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                layoutMode === "tree"
                  ? "bg-cyan-400 text-slate-950"
                  : "text-slate-500 hover:text-slate-200"
              }`}
            >
              Tree
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <button
            type="button"
            onClick={onRunCopilot}
            disabled={isReviewing}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-cyan-950/40 transition hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isReviewing ? "Co-Pilot thinking..." : "Запустити Context Co-Pilot"}
          </button>
          <button
            type="button"
            onClick={onDownloadReport}
            className="rounded-xl border border-slate-700 bg-[#0f172a] px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:border-cyan-400/70 hover:text-cyan-300"
          >
            📥 Експорт у Skill / Download Report
          </button>
        </div>
      </div>
      {error && (
        <div className="mx-auto mt-3 max-w-[1920px] rounded-lg border border-rose-500/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}
    </header>
  );
}

function IngestResearchModal({
  isOpen,
  query,
  setQuery,
  text,
  setText,
  isAnalyzing,
  onAnalyze,
  onClose,
  spotlightInputRef,
}) {
  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const uploadedText = typeof reader.result === "string" ? reader.result : "";

      setText((currentText) =>
        currentText.trim()
          ? `${currentText.trim()}\n\n${uploadedText}`
          : uploadedText
      );
      event.target.value = "";
    };

    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-md">
      <section
        className="w-full max-w-2xl rounded-2xl border border-cyan-400/25 bg-[#0f172a]/95 p-5 shadow-2xl shadow-cyan-950/50 sm:p-7"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ingest-modal-title"
      >
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-cyan-400">
              Spotlight Ingestion
            </p>
            <h2 id="ingest-modal-title" className="mt-2 text-2xl font-bold text-white">
              Start a spatial research workspace
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Define the active question and source material. Flow-AI will spawn a
              new Research Root on the canvas.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-xl leading-none text-slate-500 transition hover:bg-slate-800 hover:text-slate-100"
            aria-label="Close ingestion modal"
          >
            ×
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">
              Active Query
            </span>
            <input
              type="text"
              ref={spotlightInputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="What should Flow-AI investigate?"
              autoFocus
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            />
          </label>

          <label className="block">
            <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">
              Research Document
            </span>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Paste source material, notes, transcripts, or evidence..."
              className="mt-2 min-h-52 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            />
          </label>

          <label className="block rounded-xl border border-dashed border-cyan-400/35 bg-cyan-400/5 p-3 transition hover:border-cyan-400/70 hover:bg-cyan-400/10">
            <span className="block text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-300">
              Import source file
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">
              TXT, Markdown, CSV or JSON. The extracted text is appended to the document.
            </span>
            <input
              type="file"
              accept=".txt,.md,.csv,.json"
              onChange={handleFileUpload}
              disabled={isAnalyzing}
              className="mt-3 block w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-950 text-xs text-slate-400 file:mr-3 file:cursor-pointer file:border-0 file:bg-cyan-400 file:px-3 file:py-2 file:text-xs file:font-extrabold file:text-slate-950 hover:file:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isAnalyzing}
            className="rounded-xl px-4 py-3 text-sm font-bold text-slate-400 transition hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 text-sm font-extrabold text-slate-950 shadow-lg shadow-cyan-950/40 transition hover:from-cyan-300 hover:to-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAnalyzing
              ? "Analyzing research..."
              : "Analyze Research → Spawn Root Node"}
          </button>
        </div>
      </section>
    </div>
  );
}

const nodeTypes = {
  fact: FactNode,
  draft: DraftNode,
  contextLayer: ContextLayerNode,
  root: RootNode,
};

const readError = async (response, fallback) => {
  try {
    const body = await response.json();
    return body.detail || body.message || fallback;
  } catch {
    return fallback;
  }
};

const getEvidence = (item, isDraft) => {
  if (!item) return [];

  if (isDraft && item.proposed_hypothesis?.evidence) {
    return [
      {
        id: "draft-evidence",
        title: "Socratic hypothesis evidence",
        quote: item.proposed_hypothesis.evidence,
      },
    ];
  }

  if (Array.isArray(item.evidence)) {
    return item.evidence.filter((evidence) => evidence?.quote);
  }

  if (typeof item.evidence === "string" && item.evidence) {
    return [{ id: "evidence", title: "Source evidence", quote: item.evidence }];
  }

  return [];
};

const getConfidenceScore = (proposal) => {
  const score = proposal.confidence_score;
  return Number.isFinite(Number(score)) ? Number(score) : "—";
};

const getFactPosition = (index) => ({
  x: 100 + (index % 3) * 300,
  y: 110 + Math.floor(index / 3) * 210,
});

const getDraftPosition = (findingCount) => ({
  x: 130 + (findingCount % 3) * 300,
  y: 120 + Math.ceil(findingCount / 3) * 210,
});

export default function App() {
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [rootNode, setRootNode] = useState(null);
  const [activeMode, setActiveMode] = useState("review");
  const [layoutMode, setLayoutMode] = useState("graph");
  const [proposals, setProposals] = useState([]);
  const [findings, setFindings] = useState([]);
  const [socraticDraft, setSocraticDraft] = useState(null);
  const [draftTargetFindingId, setDraftTargetFindingId] = useState(null);
  const [contextLayers, setContextLayers] = useState([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedDraftNodeId, setSelectedDraftNodeId] = useState(null);
  const [inspectorTab, setInspectorTab] = useState("state");
  const [targetLang, setTargetLang] = useState("auto");
  const [error, setError] = useState("");
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [committingProposalId, setCommittingProposalId] = useState(null);
  const [isMergingDraft, setIsMergingDraft] = useState(false);
  const layerCounter = useRef(1);
  const spotlightInputRef = useRef(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const loadWorkspace = useCallback(async () => {
    try {
      setIsLoadingWorkspace(true);
      setError("");

      const response = await fetch(`${API_URL}/api/workspace`);

      if (!response.ok) {
        throw new Error(
          await readError(response, "Не вдалося завантажити Context Git State.")
        );
      }

      const workspace = await response.json();
      setProposals(Array.isArray(workspace.proposals) ? workspace.proposals : []);
      setFindings(Array.isArray(workspace.findings) ? workspace.findings : []);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Не вдалося підключитися до локального бекенду."
      );
    } finally {
      setIsLoadingWorkspace(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (!isLoadingWorkspace && !rootNode && findings.length === 0) {
      setIsIngestModalOpen(true);
    }
  }, [findings.length, isLoadingWorkspace, rootNode]);

  const handleResearch = useCallback(async () => {
    if (!query.trim() || !text.trim()) {
      setError("Заповніть Active Query та Research Document перед аналізом.");
      return;
    }

    try {
      setIsAnalyzing(true);
      setError("");
      setSocraticDraft(null);
      setDraftTargetFindingId(null);

      const response = await fetch(`${API_URL}/api/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          text: text.trim(),
          target_lang: targetLang,
        }),
      });

      if (!response.ok) {
        throw new Error(await readError(response, "AI-аналіз не виконався."));
      }

      setRootNode({
        id: `research-root-${Date.now()}`,
        title: query.trim(),
        createdAt: new Date().toISOString(),
      });
      setIsIngestModalOpen(false);
      await loadWorkspace();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Сталася помилка під час AI-аналізу."
      );
    } finally {
      setIsAnalyzing(false);
    }
  }, [loadWorkspace, query, targetLang, text]);

  const handleProposalCommit = async (proposalId) => {
    try {
      setCommittingProposalId(proposalId);
      setError("");

      const response = await fetch(
        `${API_URL}/api/proposals/${encodeURIComponent(proposalId)}/commit`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );

      if (!response.ok) {
        throw new Error(
          await readError(response, "Не вдалося перенести proposal до Workspace.")
        );
      }

      setSelectedItem(null);
      await loadWorkspace();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Сталася помилка під час Merge to Workspace."
      );
    } finally {
      setCommittingProposalId(null);
    }
  };

  const handleSocraticReview = useCallback(async () => {
    try {
      setIsReviewing(true);
      setError("");

      const response = await fetch(`${API_URL}/api/socratic/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_lang: targetLang }),
      });

      if (!response.ok) {
        throw new Error(
          await readError(response, "Context Co-Pilot не зміг створити draft.")
        );
      }

      const draft = await response.json();
      const selectedFinding =
        selectedItem?.kind === "finding" ? selectedItem.item : null;
      const targetFinding = selectedFinding || findings[findings.length - 1] || null;

      setDraftTargetFindingId(targetFinding?.id || null);
      setSocraticDraft(draft);
      setSelectedItem({ kind: "draft", item: draft });
      setInspectorTab("state");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Сталася помилка під час Context Co-Pilot review."
      );
    } finally {
      setIsReviewing(false);
    }
  }, [findings, selectedItem, targetLang]);

  const handleSocraticCommit = useCallback(async () => {
    if (!socraticDraft?.proposed_hypothesis) return;

    try {
      setIsMergingDraft(true);
      setError("");

      const response = await fetch(`${API_URL}/api/socratic/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(socraticDraft.proposed_hypothesis),
      });

      if (!response.ok) {
        throw new Error(
          await readError(response, "Не вдалося виконати Resolve & Merge.")
        );
      }

      setSocraticDraft(null);
      setDraftTargetFindingId(null);
      setSelectedItem(null);
      await loadWorkspace();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Сталася помилка під час Resolve & Merge."
      );
    } finally {
      setIsMergingDraft(false);
    }
  }, [loadWorkspace, socraticDraft]);

  const handleRejectDraft = useCallback(() => {
    setSocraticDraft(null);
    setDraftTargetFindingId(null);
    setSelectedDraftNodeId(null);
    setSelectedItem((current) => (current?.kind === "draft" ? null : current));
  }, []);

  useEffect(() => {
    const rootFlowNode = rootNode
      ? [
          {
            id: rootNode.id,
            type: "root",
            position: { x: 520, y: 60 },
            data: {
              root: rootNode,
              onOpenIngest: () => setIsIngestModalOpen(true),
            },
            zIndex: 3,
          },
        ]
      : [];

    const baseFactNodes = findings.map((finding, index) => ({
      id: `finding-${finding.id}`,
      type: "fact",
      position: getFactPosition(index),
      data: { finding },
      zIndex: 1,
    }));

    const layersWithMembers = contextLayers
      .map((layer) => ({
        ...layer,
        members: baseFactNodes.filter((node) => layer.memberIds.includes(node.id)),
      }))
      .filter((layer) => layer.members.length > 1);

    const membership = new Map();
    const layerNodes = layersWithMembers.map((layer) => {
      const xCoordinates = layer.members.map((node) => node.position.x);
      const yCoordinates = layer.members.map((node) => node.position.y);
      const left = Math.min(...xCoordinates) - 36;
      const top = Math.min(...yCoordinates) - 58;
      const right = Math.max(...xCoordinates) + 270;
      const bottom = Math.max(...yCoordinates) + 150;
      const frame = {
        id: layer.id,
        position: { x: left, y: top },
        width: right - left,
        height: bottom - top,
      };

      layer.members.forEach((node) => membership.set(node.id, frame));

      return {
        id: layer.id,
        type: "contextLayer",
        position: frame.position,
        style: { width: frame.width, height: frame.height },
        data: { label: layer.label, memberCount: layer.members.length },
        zIndex: 0,
      };
    });

    const factNodes = baseFactNodes.map((node) => {
      const parent = membership.get(node.id);

      if (!parent) return node;

      return {
        ...node,
        parentId: parent.id,
        extent: "parent",
        position: {
          x: node.position.x - parent.position.x,
          y: node.position.y - parent.position.y,
        },
      };
    });

    const draftTarget = findings.find((finding) => finding.id === draftTargetFindingId);
    const draftNode = socraticDraft
      ? [
          {
            id: "socratic-draft",
            type: "draft",
            position: getDraftPosition(findings.length),
            data: {
              draft: socraticDraft,
              targetTitle: draftTarget?.title,
              onMerge: handleSocraticCommit,
              onReject: handleRejectDraft,
              isMerging: isMergingDraft,
            },
            zIndex: 2,
          },
        ]
      : [];

    setNodes([...rootFlowNode, ...layerNodes, ...factNodes, ...draftNode]);
  }, [
    contextLayers,
    draftTargetFindingId,
    findings,
    handleRejectDraft,
    handleSocraticCommit,
    isMergingDraft,
    rootNode,
    setNodes,
    socraticDraft,
  ]);

  useEffect(() => {
    const findingIds = new Set(findings.map((finding) => finding.id));
    const relationEdges = findings.flatMap((finding) =>
      (finding.relations || [])
        .filter((relation) => findingIds.has(relation.target_id))
        .map((relation) => ({
          id: `relation-${finding.id}-${relation.target_id}-${relation.type}`,
          source: `finding-${finding.id}`,
          target: `finding-${relation.target_id}`,
          label: relation.type,
          type: "smoothstep",
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, color: "#22d3ee" },
          style: { stroke: "#22d3ee", strokeWidth: 1.5 },
          labelStyle: { fill: "#94a3b8", fontSize: 11 },
          labelBgStyle: { fill: "#0f172a", fillOpacity: 0.92 },
          data: { system: "relation" },
        }))
    );

    const conflictEdge =
      socraticDraft && draftTargetFindingId && findingIds.has(draftTargetFindingId)
        ? [
            {
              id: `conflict-socratic-draft-finding-${draftTargetFindingId}`,
              source: "socratic-draft",
              target: `finding-${draftTargetFindingId}`,
              label: "red-team challenge",
              type: "smoothstep",
              animated: true,
              markerEnd: { type: MarkerType.ArrowClosed, color: "#ef4444" },
              style: {
                stroke: "#ef4444",
                strokeWidth: 2,
                strokeDasharray: "5, 5",
              },
              labelStyle: { fill: "#fca5a5", fontSize: 11, fontWeight: 700 },
              labelBgStyle: { fill: "#0f172a", fillOpacity: 0.94 },
              data: { system: "conflict" },
            },
          ]
        : [];

    const validNodeIds = new Set([
      ...findings.map((finding) => `finding-${finding.id}`),
      ...(socraticDraft ? ["socratic-draft"] : []),
    ]);

    setEdges((currentEdges) => {
      const manualEdges = currentEdges.filter(
        (edge) =>
          edge.data?.system === "manual" &&
          validNodeIds.has(edge.source) &&
          validNodeIds.has(edge.target)
      );

      return [...relationEdges, ...conflictEdge, ...manualEdges];
    });
  }, [draftTargetFindingId, findings, setEdges, socraticDraft]);

  const handleConnect = useCallback(
    (connection) => {
      if (!connection.source || !connection.target || connection.source === connection.target) {
        return;
      }

      setEdges((currentEdges) =>
        addEdge(
          {
            ...connection,
            id: `manual-${connection.source}-${connection.target}-${Date.now()}`,
            type: "smoothstep",
            label: "manual link",
            markerEnd: { type: MarkerType.ArrowClosed, color: "#a78bfa" },
            style: { stroke: "#a78bfa", strokeWidth: 2 },
            labelStyle: { fill: "#c4b5fd", fontSize: 11 },
            labelBgStyle: { fill: "#0f172a", fillOpacity: 0.92 },
            data: { system: "manual" },
          },
          currentEdges
        )
      );
    },
    [setEdges]
  );

  const handleNodeClick = useCallback((event, node) => {
    event.stopPropagation();

    if (node.type === "root") {
      setIsIngestModalOpen(true);
      return;
    }

    if (node.type === "draft") {
      setSelectedItem({ kind: "draft", item: node.data.draft });
      setSelectedDraftNodeId(node.id);
      setInspectorTab("state");
      return;
    }

    if (node.type === "fact") {
      setSelectedItem({ kind: "finding", item: node.data.finding });
      setSelectedDraftNodeId(null);
      setInspectorTab("state");
    }
  }, []);

  const handleSelectionChange = useCallback(({ nodes: selectedNodes }) => {
    setSelectedNodeIds(
      selectedNodes
        .filter((node) => node.type === "fact" && !node.parentId)
        .map((node) => node.id)
    );
    setSelectedDraftNodeId(
      selectedNodes.find((node) => node.type === "draft")?.id || null
    );
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedItem(null);
    setSelectedNodeIds([]);
    setSelectedDraftNodeId(null);
  }, []);

  useEffect(() => {
    const handleHotkey = (event) => {
      const activeElement = document.activeElement;
      const isTyping =
        activeElement instanceof HTMLElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.tagName === "SELECT" ||
          activeElement.isContentEditable);

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsIngestModalOpen(true);
        requestAnimationFrame(() => {
          spotlightInputRef.current?.focus();
          spotlightInputRef.current?.select();
        });
        return;
      }

      if (
        !isTyping &&
        selectedDraftNodeId &&
        (event.key === "Backspace" || event.key === "Delete")
      ) {
        event.preventDefault();
        handleRejectDraft();
      }
    };

    window.addEventListener("keydown", handleHotkey);
    return () => window.removeEventListener("keydown", handleHotkey);
  }, [handleRejectDraft, selectedDraftNodeId]);

  const handleGroupSelection = useCallback(() => {
    const groupableNodes = nodes.filter(
      (node) =>
        selectedNodeIds.includes(node.id) && node.type === "fact" && !node.parentId
    );

    if (groupableNodes.length < 2) {
      setError("Виділіть щонайменше дві непогруповані Fact Nodes для Context Layer.");
      return;
    }

    const layerNumber = layerCounter.current;
    layerCounter.current += 1;
    setContextLayers((currentLayers) => [
      ...currentLayers,
      {
        id: `context-layer-${Date.now()}`,
        label: `Context Layer ${layerNumber}`,
        memberIds: groupableNodes.map((node) => node.id),
      },
    ]);
    setSelectedNodeIds([]);
    setError("");
  }, [nodes, selectedNodeIds]);

  const applyMagicLayout = useCallback(
    (requestedLayoutMode = layoutMode) => {
      const activeLayoutMode = requestedLayoutMode === "tree" ? "tree" : "graph";

      setNodes((currentNodes) => {
        const nextPositions = new Map();
        const rootNode = currentNodes.find((node) => node.type === "root");
        const rootPosition = { x: 100, y: 50 };

        if (rootNode) {
          nextPositions.set(rootNode.id, rootPosition);
        }

        const topLevelNodes = currentNodes.filter(
          (node) =>
            node.type === "contextLayer" ||
            (node.type === "fact" && !node.parentId)
        );

        topLevelNodes.forEach((node, index) => {
          let newX;
          let newY;

          if (activeLayoutMode === "tree") {
            newX = 100;
            newY = 250 + index * 250;
          } else {
            newX = 100 + (index % 3) * 350;
            newY = 300 + Math.floor(index / 3) * 200;
          }

          if (isNaN(newX)) newX = 100;
          if (isNaN(newY)) newY = 100;

          nextPositions.set(node.id, { x: newX, y: newY });
        });

        const groupedFacts = new Map();

        currentNodes
          .filter((node) => node.type === "fact" && node.parentId)
          .forEach((node) => {
            const siblings = groupedFacts.get(node.parentId) || [];
            siblings.push(node);
            groupedFacts.set(node.parentId, siblings);
          });

        groupedFacts.forEach((siblings) => {
          siblings.forEach((node, index) => {
            let newX = 42 + (index % 2) * 270;
            let newY = 82 + Math.floor(index / 2) * 165;

            if (isNaN(newX)) newX = 100;
            if (isNaN(newY)) newY = 100;

            nextPositions.set(node.id, { x: newX, y: newY });
          });
        });

        const positionedNodes = currentNodes.map((node) => {
          const position = nextPositions.get(node.id) || node.position || { x: 100, y: 100 };
          let newX = Number(position.x);
          let newY = Number(position.y);

          if (isNaN(newX)) newX = 100;
          if (isNaN(newY)) newY = 100;

          return {
            ...node,
            position: { x: newX, y: newY },
          };
        });

        const nodeById = new Map(positionedNodes.map((node) => [node.id, node]));

        const getAbsolutePosition = (node) => {
          const parent = node.parentId ? nodeById.get(node.parentId) : null;
          const nodeX = Number(node.position?.x);
          const nodeY = Number(node.position?.y);
          const parentX = Number(parent?.position?.x);
          const parentY = Number(parent?.position?.y);

          return {
            x: (isNaN(nodeX) ? 100 : nodeX) + (parent ? (isNaN(parentX) ? 0 : parentX) : 0),
            y: (isNaN(nodeY) ? 100 : nodeY) + (parent ? (isNaN(parentY) ? 0 : parentY) : 0),
          };
        };

        return positionedNodes.map((node, index) => {
          if (node.type !== "draft") return node;

          const target = draftTargetFindingId
            ? nodeById.get(`finding-${draftTargetFindingId}`)
            : null;
          const targetPosition = target ? getAbsolutePosition(target) : null;
          let newX;
          let newY;

          if (targetPosition) {
            newX = targetPosition.x + 320;
            newY = targetPosition.y + 20;
          } else if (activeLayoutMode === "tree") {
            newX = 450;
            newY = 250 + index * 250;
          } else {
            newX = 100 + (index % 3) * 350;
            newY = 300 + Math.floor(index / 3) * 200;
          }

          if (isNaN(newX)) newX = 100;
          if (isNaN(newY)) newY = 100;

          return {
            ...node,
            position: { x: newX, y: newY },
          };
        });
      });
    },
    [draftTargetFindingId, layoutMode, setNodes]
  );

  const generateMarkdownReport = useCallback(() => {
    const verifiedFacts = nodes.filter(
      (node) => node.type === "fact" && node.data?.finding
    );

    const report = [
      "# Flow-AI Cyber Report",
      "",
      ...verifiedFacts.flatMap((node) => {
        const finding = node.data.finding;
        const evidence = Array.isArray(finding.evidence)
          ? finding.evidence
              .map((item) => item?.quote)
              .filter(Boolean)
              .join(" | ")
          : finding.evidence;

        return [
          `## Finding: ${finding.title || "Untitled finding"}`,
          `* **Analysis:** ${finding.summary || finding.details || "No analysis available."}`,
          `* **Evidence:** "${evidence || "No evidence available."}"`,
          "",
        ];
      }),
    ].join("\n");

    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "FlowAI_Report.md";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [nodes]);

  const selectedEvidence = selectedItem
    ? getEvidence(selectedItem.item, selectedItem.kind === "draft")
    : [];

  const inspectorState = selectedItem
    ? selectedItem.kind === "draft"
      ? {
          id: "socratic-draft",
          status: "Red Team Draft Branch",
          timestamp: null,
          identified_gap: selectedItem.item.identified_gap,
          socratic_questions: selectedItem.item.socratic_questions,
          proposed_hypothesis: selectedItem.item.proposed_hypothesis,
        }
      : {
          ...selectedItem.item,
          timestamp:
            selectedItem.item.timestamp ||
            selectedItem.item.commit_state?.updated_at ||
            null,
        }
    : null;

  const inspectorReasoning = selectedItem
    ? selectedItem.kind === "draft"
      ? selectedItem.item.identified_gap
      : selectedItem.item.details
    : "Виберіть proposal у AI Inbox або verified fact на канвасі, щоб переглянути його Context Git State.";

  const historyWorkspace =
    selectedItem?.kind !== "draft"
      ? selectedItem?.item?.commit_state?.workspace || "Committed"
      : "Committed";

  const historyEntries = useMemo(
    () =>
      [...findings, ...proposals]
        .filter((item) => item.commit_state?.workspace === historyWorkspace)
        .map((item) => ({
          id: item.id,
          title: item.title,
          status: item.status,
          revision: item.commit_state.revision,
          updatedAt: item.commit_state.updated_at,
          workspace: item.commit_state.workspace,
        }))
        .sort((left, right) => right.revision - left.revision),
    [findings, historyWorkspace, proposals]
  );

  return (
    <main className="h-screen overflow-hidden bg-[#0B1120] text-slate-100">
      <div className="grid h-full grid-rows-[auto_minmax(0,1fr)]">
        <TopBar
          activeMode={activeMode}
          setActiveMode={setActiveMode}
          layoutMode={layoutMode}
          setLayoutMode={setLayoutMode}
          onLayoutChange={(mode) => {
            setLayoutMode(mode);
            applyMagicLayout(mode);
          }}
          onOpenIngest={() => setIsIngestModalOpen(true)}
          onRunCopilot={handleSocraticReview}
          onMagicLayout={() => applyMagicLayout()}
          onDownloadReport={generateMarkdownReport}
          isReviewing={isReviewing}
          error={error}
        />

        <div className="grid min-h-0 grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
          <aside className="flex min-h-0 flex-col border-r border-slate-800 bg-[#0F172A]">
            <div className="border-b border-slate-800 px-4 py-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-orange-400">
                AI Inbox
              </p>
              <div className="mt-1 flex items-center justify-between">
                <h2 className="font-bold text-white">Proposals</h2>
                <span className="rounded-full bg-orange-400/10 px-2 py-0.5 text-xs font-bold text-orange-300">
                  {proposals.length}
                </span>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
              {isLoadingWorkspace ? (
                <p className="py-8 text-center text-sm text-slate-500">Loading inbox...</p>
              ) : proposals.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 p-4 text-center text-sm text-slate-500">
                  Inbox порожній. Запустіть AI-аналіз, щоб створити proposals.
                </div>
              ) : (
                proposals.map((proposal) => (
                  <article
                    key={proposal.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelectedItem({ kind: "proposal", item: proposal });
                      setInspectorTab("state");
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedItem({ kind: "proposal", item: proposal });
                        setInspectorTab("state");
                      }
                    }}
                    className={`cursor-pointer rounded-xl border p-3 transition ${
                      selectedItem?.kind === "proposal" &&
                      selectedItem.item.id === proposal.id
                        ? "border-orange-300 bg-orange-400/10 ring-1 ring-orange-400/30"
                        : "border-slate-700 bg-slate-900/70 hover:border-orange-400/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold leading-5 text-slate-100">
                        {proposal.title}
                      </h3>
                      <span className="shrink-0 rounded bg-cyan-400/10 px-1.5 py-1 text-[10px] font-extrabold text-cyan-300">
                        {getConfidenceScore(proposal)}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Intrinsic Score
                    </p>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">
                      {proposal.details}
                    </p>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleProposalCommit(proposal.id);
                      }}
                      disabled={committingProposalId === proposal.id}
                      className="mt-3 w-full rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-2 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {committingProposalId === proposal.id
                        ? "Merging..."
                        : "Merge to Workspace"}
                    </button>
                  </article>
                ))
              )}
            </div>
          </aside>

          <section className="relative min-h-0 bg-[#0B1120]" aria-label="Knowledge graph canvas">
            <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-lg border border-slate-700/80 bg-slate-900/90 px-3 py-2 backdrop-blur">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-cyan-400">
                Workspace Graph
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                Drag facts, connect handles, then drag-select nodes to build a Context Layer.
              </p>
            </div>

            <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-900/90 p-2 backdrop-blur">
              <span className="px-1 text-xs font-semibold text-slate-400">
                {selectedNodeIds.length} selected
              </span>
              <button
                type="button"
                onClick={handleGroupSelection}
                disabled={selectedNodeIds.length < 2}
                className="rounded-md bg-cyan-400 px-3 py-1.5 text-xs font-extrabold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Group
              </button>
            </div>

            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={handleConnect}
              onNodeClick={handleNodeClick}
              onPaneClick={handlePaneClick}
              onSelectionChange={handleSelectionChange}
              selectionOnDrag
              fitView
              fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
              minZoom={0.2}
              maxZoom={1.8}
              defaultEdgeOptions={{ type: "smoothstep" }}
              proOptions={{ hideAttribution: true }}
              className="bg-[#0B1120]"
            >
              <Background color="#334155" gap={16} size={1} />
              <MiniMap
                bgColor="#0f172a"
                maskColor="rgba(11, 17, 32, 0.78)"
                nodeColor={(node) => {
                  if (node.type === "draft") return "#ef4444";
                  if (node.type === "contextLayer") return "#22d3ee";
                  return "#34d399";
                }}
                nodeStrokeColor="#334155"
                nodeBorderRadius={8}
                className="!border !border-slate-700 !bg-[#0f172a] !shadow-2xl"
              />
              <Controls
                className="!overflow-hidden !rounded-xl !border !border-slate-700 !bg-[#0f172a] !shadow-2xl [&_button]:!h-9 [&_button]:!w-9 [&_button]:!border-0 [&_button]:!border-b [&_button]:!border-slate-700 [&_button]:!bg-[#0f172a] [&_button]:!text-cyan-400 [&_button:hover]:!bg-slate-800 [&_button:last-child]:!border-b-0 [&_button_svg]:!fill-cyan-400 [&_button_svg]:!stroke-cyan-400"
              />
            </ReactFlow>
          </section>

          <aside className="flex min-h-0 flex-col border-l border-slate-800 bg-[#0F172A]">
            <div className="border-b border-slate-800 p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-yellow-400">
                Socratic Co-Pilot
              </p>
              <label className="mt-3 block">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
                  Response language
                </span>
                <select
                  value={targetLang}
                  onChange={(event) => setTargetLang(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-200 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                >
                  <option value="auto">Auto</option>
                  <option value="en">English</option>
                  <option value="uk">Українська</option>
                </select>
              </label>
              <button
                type="button"
                onClick={handleSocraticReview}
                disabled={isReviewing}
                className="mt-3 w-full rounded-xl bg-yellow-400 px-4 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isReviewing ? "Co-Pilot thinking..." : "Запустити Context Co-Pilot"}
              </button>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={applyMagicLayout}
                  className="rounded-lg border border-cyan-400/60 bg-cyan-400/10 px-3 py-2.5 text-xs font-extrabold text-cyan-300 transition hover:bg-cyan-400 hover:text-slate-950"
                >
                  ⚡ Magic Layout
                </button>
                <button
                  type="button"
                  onClick={generateMarkdownReport}
                  className="rounded-lg border border-violet-400/60 bg-violet-400/10 px-3 py-2.5 text-xs font-extrabold text-violet-300 transition hover:bg-violet-400 hover:text-slate-950"
                >
                  📥 Download Report
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-cyan-400">
                    Inspector
                  </p>
                  <h2 className="mt-1 font-bold text-white">Context Git State</h2>
                </div>
                {selectedItem && (
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-extrabold ${
                      selectedItem.kind === "draft"
                        ? "bg-yellow-400/15 text-yellow-300"
                        : selectedItem.kind === "proposal"
                          ? "bg-orange-400/15 text-orange-300"
                          : "bg-emerald-400/15 text-emerald-300"
                    }`}
                  >
                    {selectedItem.kind === "draft"
                      ? "DRAFT"
                      : selectedItem.kind === "proposal"
                        ? "INBOX"
                        : "VERIFIED"}
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 rounded-lg border border-slate-700 bg-slate-950/60 p-1">
                <button
                  type="button"
                  onClick={() => setInspectorTab("state")}
                  className={`rounded-md px-3 py-2 text-xs font-bold transition ${
                    inspectorTab === "state"
                      ? "bg-cyan-400 text-slate-950"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  State
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorTab("history")}
                  className={`rounded-md px-3 py-2 text-xs font-bold transition ${
                    inspectorTab === "history"
                      ? "bg-cyan-400 text-slate-950"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  History
                </button>
              </div>

              {inspectorTab === "history" ? (
                <section className="mt-4 rounded-xl border border-slate-700 bg-slate-950/55 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-cyan-300">
                        Local Commit History
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Workspace: {historyWorkspace}
                      </p>
                    </div>
                    <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-[10px] font-bold text-cyan-300">
                      {historyEntries.length} revisions
                    </span>
                  </div>

                  {historyEntries.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-500">
                      Локальна історія поки що не має commit revisions.
                    </p>
                  ) : (
                    <ol className="mt-4 space-y-3 border-l border-cyan-500/30 pl-4">
                      {historyEntries.map((entry) => (
                        <li key={`${entry.id}-${entry.revision}`} className="relative">
                          <span className="absolute -left-[1.34rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-slate-950 bg-cyan-400" />
                          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-bold text-slate-100">{entry.title}</p>
                              <span className="shrink-0 text-xs font-extrabold text-cyan-300">
                                r{entry.revision}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {entry.status} · {entry.updatedAt || "timestamp unavailable"}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}

                  <button
                    type="button"
                    disabled
                    className="mt-5 w-full cursor-not-allowed rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm font-bold text-slate-500"
                  >
                    Checkout (Rollback)
                  </button>
                </section>
              ) : !selectedItem ? (
                <div className="mt-4 rounded-xl border border-dashed border-slate-700 p-4 text-sm leading-6 text-slate-500">
                  {inspectorReasoning}
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <section className="rounded-xl border border-slate-700 bg-slate-950/55 p-3">
                    <h3 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                      Pydantic State · Raw JSON
                    </h3>
                    <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-cyan-100">
                      {JSON.stringify(inspectorState, null, 2)}
                    </pre>
                  </section>

                  <section className="rounded-xl border border-cyan-500/30 bg-cyan-400/5 p-3">
                    <h3 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-cyan-300">
                      Source Evidence · Strict Evidence Mapping
                    </h3>
                    {selectedEvidence.length === 0 ? (
                      <p className="mt-3 text-sm text-slate-500">Докази відсутні.</p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {selectedEvidence.map((evidence, index) => (
                          <blockquote
                            key={evidence.id || `${evidence.quote}-${index}`}
                            className="border-l-2 border-cyan-400 pl-3"
                          >
                            {evidence.title && (
                              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                {evidence.title}
                              </p>
                            )}
                            <p className="whitespace-pre-wrap text-sm italic leading-6 text-slate-200">
                              “{evidence.quote}”
                            </p>
                          </blockquote>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="rounded-xl border border-violet-500/30 bg-violet-400/5 p-3">
                    <h3 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-violet-300">
                      AI Reasoning
                    </h3>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-200">
                      {inspectorReasoning}
                    </p>

                    {selectedItem.kind === "draft" && (
                      <>
                        <div className="mt-4 border-t border-violet-400/20 pt-3">
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-violet-300">
                            Socratic Questions
                          </p>
                          <ol className="mt-2 space-y-2 text-sm leading-5 text-slate-300">
                            {selectedItem.item.socratic_questions.map((question, index) => (
                              <li key={`${question}-${index}`} className="flex gap-2">
                                <span className="font-bold text-yellow-300">{index + 1}.</span>
                                <span>{question}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                        <div className="mt-4 rounded-lg border border-yellow-500/30 bg-slate-950/45 p-3">
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-yellow-300">
                            Proposed Hypothesis · {selectedItem.item.proposed_hypothesis.confidence_score}% confidence
                          </p>
                          <p className="mt-2 font-semibold text-slate-100">
                            {selectedItem.item.proposed_hypothesis.title}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-300">
                            {selectedItem.item.proposed_hypothesis.details}
                          </p>
                        </div>
                      </>
                    )}
                  </section>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
      <IngestResearchModal
        isOpen={isIngestModalOpen}
        query={query}
        setQuery={setQuery}
        text={text}
        setText={setText}
        isAnalyzing={isAnalyzing}
        onAnalyze={handleResearch}
        onClose={() => setIsIngestModalOpen(false)}
        spotlightInputRef={spotlightInputRef}
      />
    </main>
  );
}
