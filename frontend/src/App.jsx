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
            Research Topic
          </p>
          <p className="mt-1 max-w-56 text-sm font-bold leading-5 text-white">
            {data.root.title}
          </p>
          <p className="mt-1 max-w-56 text-xs leading-5 text-slate-400">
            {data.root.query}
          </p>
        </div>
        <span className="rounded-lg bg-cyan-400 px-2 py-1 text-xs font-black text-slate-950">
          F
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
        <span className="rounded-full border border-slate-700 bg-slate-950 px-2 py-1">
          {data.root.source_count || 0} sources
        </span>
        <span className="rounded-full border border-slate-700 bg-slate-950 px-2 py-1">
          {data.root.finding_count || 0} facts
        </span>
      </div>
      <button
        type="button"
        onClick={openIngestion}
        className="mt-4 rounded-lg border border-cyan-400/50 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-200 transition hover:bg-cyan-400 hover:text-slate-950"
      >
        + Add paper / source
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
  const layoutOptions = [
    { id: "graph", label: "Graph" },
    { id: "tree", label: "Tree" },
    { id: "timeline", label: "Timeline" },
    { id: "comparison", label: "Compare" },
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
              • gpt-5.6-luna - Cost-aware workspace sync
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
            {layoutOptions.map((layout) => (
              <button
                key={layout.id}
                type="button"
                onClick={() => changeLayout(layout.id)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                  layoutMode === layout.id
                    ? "bg-cyan-400 text-slate-950"
                    : "text-slate-500 hover:text-slate-200"
                }`}
              >
                {layout.label}
              </button>
            ))}
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
  ingestMode,
  activeTopicTitle,
  query,
  setQuery,
  text,
  setText,
  sourceTitle,
  setSourceTitle,
  sourcePageCount,
  setSourcePageCount,
  isExtractingSource,
  onExtractFile,
  isAnalyzing,
  onAnalyze,
  onClose,
  spotlightInputRef,
}) {
  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setSourceTitle(file.name);

    if (file.name.toLowerCase().endsWith(".pdf")) {
      onExtractFile(file);
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const uploadedText = typeof reader.result === "string" ? reader.result : "";

      setText((currentText) =>
        currentText.trim()
          ? `${currentText.trim()}\n\n${uploadedText}`
          : uploadedText
      );
      setSourcePageCount(0);
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
              {ingestMode === "source"
                ? `Add evidence to ${activeTopicTitle || "research topic"}`
                : "Start a new research topic"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {ingestMode === "source"
                ? "Import another paper, note, or dataset. New findings will connect to the active topic and relevant verified facts."
                : "Define a concrete question and the first source. Flow-AI will create a dedicated topic root on the canvas."}
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
              Source / paper title
            </span>
            <input
              type="text"
              value={sourceTitle}
              onChange={(event) => setSourceTitle(event.target.value)}
              placeholder="e.g. Iliad translation, paper title, or dataset name"
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
              PDF, TXT, Markdown, CSV or JSON. PDF pages are extracted locally by the backend and mapped back to evidence.
            </span>
            <input
              type="file"
              accept=".pdf,.txt,.md,.csv,.json"
              onChange={handleFileUpload}
              disabled={isAnalyzing || isExtractingSource}
              className="mt-3 block w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-950 text-xs text-slate-400 file:mr-3 file:cursor-pointer file:border-0 file:bg-cyan-400 file:px-3 file:py-2 file:text-xs file:font-extrabold file:text-slate-950 hover:file:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            />
            {isExtractingSource && (
              <span className="mt-2 block text-xs font-semibold text-cyan-300">
                Extracting readable text from the source…
              </span>
            )}
            {!isExtractingSource && sourcePageCount > 0 && (
              <span className="mt-2 block text-xs font-semibold text-emerald-300">
                {sourcePageCount} PDF pages ready for evidence mapping.
              </span>
            )}
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
            disabled={isAnalyzing || isExtractingSource}
            className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 text-sm font-extrabold text-slate-950 shadow-lg shadow-cyan-950/40 transition hover:from-cyan-300 hover:to-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAnalyzing
              ? "Analyzing research..."
              : ingestMode === "source"
                ? "Analyze Source → Connect Findings"
                : "Analyze Research → Create Topic"}
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

const GRAPH_UI_STORAGE_KEY = "flow-ai-graph-ui-v4";

const readGraphUiState = () => {
  try {
    const storedValue = window.localStorage.getItem(GRAPH_UI_STORAGE_KEY);
    const parsed = storedValue ? JSON.parse(storedValue) : {};

    return {
      nodePositions:
        parsed.nodePositions && typeof parsed.nodePositions === "object"
          ? parsed.nodePositions
          : {},
      manualEdges: Array.isArray(parsed.manualEdges) ? parsed.manualEdges : [],
      contextLayers: Array.isArray(parsed.contextLayers) ? parsed.contextLayers : [],
    };
  } catch {
    return { nodePositions: {}, manualEdges: [], contextLayers: [] };
  }
};

const isUsablePosition = (position) =>
  Number.isFinite(Number(position?.x)) && Number.isFinite(Number(position?.y));

const getSavedPosition = (positions, nodeId, fallback) => {
  const storedPosition = positions[nodeId];

  return isUsablePosition(storedPosition)
    ? { x: Number(storedPosition.x), y: Number(storedPosition.y) }
    : fallback;
};

const getAbsoluteNodePosition = (nodes, nodeId) => {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  let current = nodeById.get(nodeId);
  let x = 0;
  let y = 0;
  const visited = new Set();

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    x += Number(current.position?.x) || 0;
    y += Number(current.position?.y) || 0;
    current = current.parentId ? nodeById.get(current.parentId) : null;
  }

  return { x, y };
};

const getTopicPosition = (index) => ({
  x: 130 + (index % 2) * 760,
  y: 60 + Math.floor(index / 2) * 620,
});

const getFactPosition = (topicIndex, factIndex) => {
  const topicPosition = getTopicPosition(topicIndex);

  return {
    x: topicPosition.x + (factIndex % 2) * 320,
    y: topicPosition.y + 230 + Math.floor(factIndex / 2) * 210,
  };
};

const getDraftPosition = (topicIndex, findingCount) => {
  const topicPosition = getTopicPosition(topicIndex);

  return {
    x: topicPosition.x + 660,
    y: topicPosition.y + 230 + findingCount * 70,
  };
};

export default function App() {
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourcePageCount, setSourcePageCount] = useState(0);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [ingestMode, setIngestMode] = useState("topic");
  const [researchTopics, setResearchTopics] = useState([]);
  const [activeTopicId, setActiveTopicId] = useState(null);
  const [activeMode, setActiveMode] = useState("review");
  const [layoutMode, setLayoutMode] = useState("graph");
  const [proposals, setProposals] = useState([]);
  const [findings, setFindings] = useState([]);
  const [socraticDraft, setSocraticDraft] = useState(null);
  const [draftTargetFindingId, setDraftTargetFindingId] = useState(null);
  const [draftTopicId, setDraftTopicId] = useState(null);
  const persistedGraphRef = useRef(readGraphUiState());
  const [contextLayers, setContextLayers] = useState(
    () => persistedGraphRef.current.contextLayers
  );
  const [nodePositions, setNodePositions] = useState(
    () => persistedGraphRef.current.nodePositions
  );
  const [manualEdges, setManualEdges] = useState(
    () => persistedGraphRef.current.manualEdges
  );
  const [selectedNodeIds, setSelectedNodeIds] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedDraftNodeId, setSelectedDraftNodeId] = useState(null);
  const [inspectorTab, setInspectorTab] = useState("state");
  const [targetLang, setTargetLang] = useState("auto");
  const [workspaceHistory, setWorkspaceHistory] = useState([]);
  const [error, setError] = useState("");
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtractingSource, setIsExtractingSource] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isDiscoveringConnections, setIsDiscoveringConnections] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [committingProposalId, setCommittingProposalId] = useState(null);
  const [isMergingDraft, setIsMergingDraft] = useState(false);
  const layerCounter = useRef(1);
  const spotlightInputRef = useRef(null);
  const applyMagicLayoutRef = useRef(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const buildUiState = useCallback(() => {
    const nodePositions = nodes.map((node) => {
      const absolute = getAbsoluteNodePosition(nodes, node.id);
      return { id: node.id, x: absolute.x, y: absolute.y };
    });

    return {
      mode: layoutMode,
      selected_node_id: selectedNodeIds?.[0] || null,
      node_positions: nodePositions,
    };
  }, [nodes, layoutMode, selectedNodeIds]);

  const applyRestoredUiState = useCallback(
    (uiState) => {
      if (!uiState?.node_positions?.length) return;
      const restored = {};
      uiState.node_positions.forEach((position) => {
        restored[position.id] = { x: Number(position.x), y: Number(position.y) };
      });
      setNodePositions(restored);
    },
    [setNodePositions]
  );

  const persistUiState = useCallback(async () => {
    try {
      const uiState = buildUiState();
      await fetch(`${API_URL}/api/workspace/ui-state`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ui_state: uiState }),
      });
    } catch {
      // best-effort: UI persistence must never block the primary action
    }
  }, [buildUiState]);

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
      setWorkspaceHistory(Array.isArray(workspace.history) ? workspace.history : []);
      const nextTopics = Array.isArray(workspace.topics) ? workspace.topics : [];
      setResearchTopics(nextTopics);
      setActiveTopicId((currentTopicId) =>
        nextTopics.some((topic) => topic.id === currentTopicId)
          ? currentTopicId
          : nextTopics[0]?.id || null
      );
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
    if (!isLoadingWorkspace && researchTopics.length === 0 && findings.length === 0) {
      setIngestMode("topic");
      setIsIngestModalOpen(true);
    }
  }, [findings.length, isLoadingWorkspace, researchTopics.length]);

  useEffect(() => {
    window.localStorage.setItem(
      GRAPH_UI_STORAGE_KEY,
      JSON.stringify({ nodePositions, manualEdges, contextLayers })
    );
  }, [contextLayers, manualEdges, nodePositions]);

  const activeTopic = useMemo(
    () => researchTopics.find((topic) => topic.id === activeTopicId) || null,
    [activeTopicId, researchTopics]
  );

  const openNewTopic = useCallback(() => {
    setIngestMode("topic");
    setActiveTopicId(null);
    setQuery("");
    setText("");
    setSourceTitle("");
    setSourcePageCount(0);
    setError("");
    setIsIngestModalOpen(true);
  }, []);

  const openSourceIngestion = useCallback(
    (topicId = activeTopicId) => {
      const topic = researchTopics.find((item) => item.id === topicId);

      if (!topic) {
        openNewTopic();
        return;
      }

      setIngestMode("source");
      setActiveTopicId(topic.id);
      setQuery(topic.query || topic.title);
      setText("");
      setSourceTitle("");
      setSourcePageCount(0);
      setError("");
      setIsIngestModalOpen(true);
    },
    [activeTopicId, openNewTopic, researchTopics]
  );

  const handleSourceExtraction = useCallback(async (file) => {
    try {
      setIsExtractingSource(true);
      setError("");
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/api/sources/extract`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          await readError(response, "Не вдалося витягнути текст із джерела.")
        );
      }

      const extractedSource = await response.json();
      setText((currentText) =>
        currentText.trim()
          ? `${currentText.trim()}\n\n${extractedSource.text}`
          : extractedSource.text
      );
      setSourceTitle(extractedSource.source_title || file.name);
      setSourcePageCount(Number(extractedSource.page_count) || 0);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Не вдалося витягнути текст із джерела."
      );
    } finally {
      setIsExtractingSource(false);
    }
  }, []);

  const handleResearch = useCallback(async () => {
    if (isExtractingSource) {
      setError("Дочекайтеся завершення витягування тексту з джерела.");
      return;
    }

    if (!query.trim() || !text.trim()) {
      setError("Заповніть Active Query та Research Document перед аналізом.");
      return;
    }

    try {
      setIsAnalyzing(true);
      setError("");
      setSocraticDraft(null);
      setDraftTargetFindingId(null);
      await persistUiState();

      const response = await fetch(`${API_URL}/api/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          text: text.trim(),
          target_lang: targetLang,
          topic_id: ingestMode === "source" ? activeTopicId : null,
          topic_title: ingestMode === "topic" ? query.trim() : null,
          source_title: sourceTitle.trim() || "Research document",
          source_page_count: sourcePageCount,
        }),
      });

      if (!response.ok) {
        throw new Error(await readError(response, "AI-аналіз не виконався."));
      }

      const data = await response.json();
      const suggestedLayout =
        ["graph", "tree", "timeline", "comparison"].includes(
          data?.suggested_layout
        )
          ? data.suggested_layout
          : null;

      if (data?.topic?.id) {
        setActiveTopicId(data.topic.id);
        setResearchTopics((currentTopics) => {
          const existingTopicIndex = currentTopics.findIndex(
            (topic) => topic.id === data.topic.id
          );

          if (existingTopicIndex < 0) return [...currentTopics, data.topic];

          return currentTopics.map((topic) =>
            topic.id === data.topic.id ? data.topic : topic
          );
        });
      }

      setIsIngestModalOpen(false);
      setText("");
      setSourceTitle("");
      setSourcePageCount(0);

      await loadWorkspace();

      if (suggestedLayout) {
        setLayoutMode(suggestedLayout);
        requestAnimationFrame(() => applyMagicLayoutRef.current?.(suggestedLayout));
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Сталася помилка під час AI-аналізу."
      );
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    activeTopicId,
    ingestMode,
    isExtractingSource,
    loadWorkspace,
    query,
    sourcePageCount,
    sourceTitle,
    targetLang,
    text,
  ]);

  const handleProposalCommit = async (proposalId) => {
    try {
      setCommittingProposalId(proposalId);
      setError("");
      await persistUiState();

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

  const handleDiscoverConnections = useCallback(async () => {
    if (!activeTopicId) {
      setError("Спочатку виберіть research topic для пошуку зв’язків.");
      return;
    }

    try {
      setIsDiscoveringConnections(true);
      setError("");
      await persistUiState();
      const response = await fetch(
        `${API_URL}/api/topics/${encodeURIComponent(activeTopicId)}/relations/discover`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target_lang: targetLang }),
        }
      );

      if (!response.ok) {
        throw new Error(
          await readError(response, "Не вдалося знайти зв’язки між фактами.")
        );
      }

      await loadWorkspace();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Не вдалося знайти зв’язки між фактами."
      );
    } finally {
      setIsDiscoveringConnections(false);
    }
  }, [activeTopicId, loadWorkspace, targetLang]);

  const handleSocraticReview = useCallback(async () => {
    const selectedNode = nodes.find(
      (node) => node.selected && node.type === "fact"
    );

    try {
      setIsReviewing(true);
      setError("");

      const response = await fetch(`${API_URL}/api/socratic/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_lang: targetLang,
          fact_id: selectedNode?.data?.finding?.id,
          fact_text: selectedNode?.data?.label,
          topic_id: selectedNode?.data?.finding?.topic_id || activeTopicId,
        }),
      });

      if (!response.ok) {
        throw new Error(
          await readError(response, "Context Co-Pilot не зміг створити draft.")
        );
      }

      const draft = await response.json();

      setDraftTargetFindingId(selectedNode?.id || null);
      setDraftTopicId(selectedNode?.data?.finding?.topic_id || activeTopicId || null);
      setSocraticDraft(draft);
      setSelectedItem({ kind: "draft", item: draft });
      setInspectorTab("state");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Сталася помилка під Context Co-Pilot review."
      );
    } finally {
      setIsReviewing(false);
    }
  }, [activeTopicId, nodes, targetLang]);

  const handleSocraticCommit = useCallback(async () => {
    if (!socraticDraft?.proposed_hypothesis) return;

    try {
      setIsMergingDraft(true);
      setError("");
      await persistUiState();
      const response = await fetch(`${API_URL}/api/socratic/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...socraticDraft.proposed_hypothesis,
          topic_id: draftTopicId || activeTopicId,
        }),
      });

      if (!response.ok) {
        throw new Error(
          await readError(response, "Не вдалося виконати Resolve & Merge.")
        );
      }

      setSocraticDraft(null);
      setDraftTargetFindingId(null);
      setDraftTopicId(null);
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
  }, [activeTopicId, draftTopicId, loadWorkspace, socraticDraft]);

  const handleRejectDraft = useCallback(() => {
    setSocraticDraft(null);
    setDraftTargetFindingId(null);
    setDraftTopicId(null);
    setSelectedDraftNodeId(null);
    setSelectedItem((current) => (current?.kind === "draft" ? null : current));
  }, []);

  useEffect(() => {
    const topicIndexById = new Map(
      researchTopics.map((topic, index) => [topic.id, index])
    );
    const topicFlowNodes = researchTopics.map((topic, index) => ({
      id: `topic-${topic.id}`,
      type: "root",
      position: getSavedPosition(
        nodePositions,
        `topic-${topic.id}`,
        getTopicPosition(index)
      ),
      data: {
        root: topic,
        onOpenIngest: () => openSourceIngestion(topic.id),
      },
      zIndex: 3,
    }));

    const factCountByTopic = new Map();
    const baseFactNodes = findings.map((finding, index) => {
      const topicIndex = topicIndexById.get(finding.topic_id) ?? 0;
      const factIndex = factCountByTopic.get(finding.topic_id) ?? index;
      factCountByTopic.set(finding.topic_id, factIndex + 1);
      const nodeId = `finding-${finding.id}`;

      return {
        id: nodeId,
        type: "fact",
        position: getSavedPosition(
          nodePositions,
          nodeId,
          getFactPosition(topicIndex, factIndex)
        ),
        data: { finding, label: finding.details },
        zIndex: 1,
      };
    });

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
        draggable: false,
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

    const draftTarget = findings.find(
      (finding) => `finding-${finding.id}` === draftTargetFindingId
    );
    const draftTopicIndex = topicIndexById.get(draftTarget?.topic_id || activeTopicId) ?? 0;
    const draftNode = socraticDraft
      ? [
          {
            id: "socratic-draft",
            type: "draft",
            position: getSavedPosition(
              nodePositions,
              "socratic-draft",
              getDraftPosition(draftTopicIndex, findings.length)
            ),
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

    setNodes([...topicFlowNodes, ...layerNodes, ...factNodes, ...draftNode]);
  }, [
    activeTopicId,
    contextLayers,
    draftTargetFindingId,
    findings,
    handleRejectDraft,
    handleSocraticCommit,
    isMergingDraft,
    nodePositions,
    openSourceIngestion,
    researchTopics,
    setNodes,
    socraticDraft,
  ]);

  useEffect(() => {
    const findingIds = new Set(findings.map((finding) => finding.id));
    const findingNodeIds = new Set(findings.map((finding) => `finding-${finding.id}`));
    const topicNodeIds = new Set(researchTopics.map((topic) => `topic-${topic.id}`));
    const topicEdges = findings
      .filter(
        (finding) =>
          finding.topic_id && topicNodeIds.has(`topic-${finding.topic_id}`)
      )
      .map((finding) => ({
        id: `topic-${finding.topic_id}-finding-${finding.id}`,
        source: `topic-${finding.topic_id}`,
        target: `finding-${finding.id}`,
        label: "evidence trail",
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#38bdf8" },
        style: { stroke: "#38bdf8", strokeWidth: 1.4, opacity: 0.82 },
        labelStyle: { fill: "#7dd3fc", fontSize: 10 },
        labelBgStyle: { fill: "#0f172a", fillOpacity: 0.92 },
        data: { system: "topic" },
      }));
    const relationEdges = findings.flatMap((finding) =>
      (finding.relations || [])
        .filter((relation) => findingIds.has(relation.target_id))
        .map((relation) => {
          const isManualRelation = relation.origin === "manual";
          const edgeColor = isManualRelation ? "#a78bfa" : "#22d3ee";

          return {
            id: `relation-${finding.id}-${relation.target_id}-${relation.type}`,
            source: `finding-${finding.id}`,
            target: `finding-${relation.target_id}`,
            label: relation.confidence_score
              ? `${relation.type} · ${relation.confidence_score}%`
              : relation.type,
            type: "smoothstep",
            animated: !isManualRelation,
            deletable: isManualRelation,
            markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
            style: { stroke: edgeColor, strokeWidth: isManualRelation ? 2 : 1.5 },
            labelStyle: { fill: isManualRelation ? "#c4b5fd" : "#94a3b8", fontSize: 11 },
            labelBgStyle: { fill: "#0f172a", fillOpacity: 0.92 },
            data: {
              system: isManualRelation ? "manual-persisted" : "relation",
              sourceFindingId: finding.id,
              targetFindingId: relation.target_id,
            },
          };
        }));

    const conflictEdge =
      socraticDraft && draftTargetFindingId && findingNodeIds.has(draftTargetFindingId)
        ? [
            {
              id: `conflict-socratic-draft-${draftTargetFindingId}`,
              source: "socratic-draft",
              target: draftTargetFindingId,
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
      ...researchTopics.map((topic) => `topic-${topic.id}`),
      ...findings.map((finding) => `finding-${finding.id}`),
      ...(socraticDraft ? ["socratic-draft"] : []),
    ]);

    setEdges(() => {
      const validManualEdges = manualEdges.filter(
        (edge) =>
          validNodeIds.has(edge.source) &&
          validNodeIds.has(edge.target)
      );

      return [...topicEdges, ...relationEdges, ...conflictEdge, ...validManualEdges];
    });
  }, [
    draftTargetFindingId,
    findings,
    manualEdges,
    researchTopics,
    setEdges,
    socraticDraft,
  ]);

  const handleNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
      setNodePositions((currentPositions) => {
        let hasPositionChange = false;
        const nextPositions = { ...currentPositions };

        changes.forEach((change) => {
          if (
            change.type !== "position" ||
            !change.position ||
            !isUsablePosition(change.position)
          ) {
            return;
          }

          // Ignore movement of the contextLayer frame itself.
          const changedNode = nodes.find((node) => node.id === change.id);
          if (changedNode?.type === "contextLayer") return;

          nextPositions[change.id] = {
            x: Number(change.position.x),
            y: Number(change.position.y),
          };
          hasPositionChange = true;
        });

        return hasPositionChange ? nextPositions : currentPositions;
      });
    },
    [nodes, onNodesChange]
  );

  const removePersistedManualRelation = useCallback(
    async (sourceFindingId, targetFindingId) => {
      try {
        setError("");
        await persistUiState();
        const response = await fetch(
          `${API_URL}/api/findings/${encodeURIComponent(sourceFindingId)}/relations/${encodeURIComponent(targetFindingId)}`,
          { method: "DELETE" }
        );

        if (!response.ok) {
          throw new Error(
            await readError(response, "Не вдалося видалити ручний зв’язок.")
          );
        }

        await loadWorkspace();
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Не вдалося видалити ручний зв’язок."
        );
        await loadWorkspace();
      }
    },
    [loadWorkspace]
  );

  const handleEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes);
      const removedEdgeIds = changes
        .filter((change) => change.type === "remove")
        .map((change) => change.id);

      if (removedEdgeIds.length > 0) {
        setManualEdges((currentEdges) =>
          currentEdges.filter((edge) => !removedEdgeIds.includes(edge.id))
        );

        edges
          .filter(
            (edge) =>
              removedEdgeIds.includes(edge.id) &&
              edge.data?.system === "manual-persisted"
          )
          .forEach((edge) => {
            void removePersistedManualRelation(
              edge.data.sourceFindingId,
              edge.data.targetFindingId
            );
          });
      }
    },
    [edges, onEdgesChange, removePersistedManualRelation]
  );

  const handleConnect = useCallback(
    (connection) => {
      if (!connection.source || !connection.target || connection.source === connection.target) {
        return;
      }

      const edgeId = `manual-${connection.source}-${connection.target}-${Date.now()}`;
      const nextManualEdge = {
        ...connection,
        id: edgeId,
        type: "smoothstep",
        label: "manual link",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#a78bfa" },
        style: { stroke: "#a78bfa", strokeWidth: 2 },
        labelStyle: { fill: "#c4b5fd", fontSize: 11 },
        labelBgStyle: { fill: "#0f172a", fillOpacity: 0.92 },
        data: { system: "manual" },
      };

      setManualEdges((currentEdges) => {
        const duplicateExists = currentEdges.some(
          (edge) => edge.source === connection.source && edge.target === connection.target
        );

        return duplicateExists ? currentEdges : addEdge(nextManualEdge, currentEdges);
      });

      if (
        connection.source.startsWith("finding-") &&
        connection.target.startsWith("finding-")
      ) {
        const sourceFindingId = connection.source.replace("finding-", "");
        const targetFindingId = connection.target.replace("finding-", "");

        void (async () => {
          try {
            await persistUiState();
            const response = await fetch(
              `${API_URL}/api/findings/${encodeURIComponent(sourceFindingId)}/relations`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ target_id: targetFindingId, type: "manual link" }),
              }
            );

            if (!response.ok) {
              throw new Error(
                await readError(response, "Не вдалося зберегти ручний зв’язок.")
              );
            }

            setManualEdges((currentEdges) =>
              currentEdges.filter((edge) => edge.id !== edgeId)
            );
            await loadWorkspace();
          } catch (requestError) {
            setError(
              requestError instanceof Error
                ? requestError.message
                : "Ручний зв’язок збережено лише локально."
            );
          }
        })();
      }
    },
    [loadWorkspace]
  );

  const handleNodeClick = useCallback((event, node) => {
    event.stopPropagation();

    if (node.type === "root") {
      setActiveTopicId(node.data.root.id);
      openSourceIngestion(node.data.root.id);
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
  }, [openSourceIngestion]);

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
        openNewTopic();
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
  }, [handleRejectDraft, openNewTopic, selectedDraftNodeId]);

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

  function applyMagicLayout(requestedLayoutMode = layoutMode) {
    const activeLayoutMode = ["graph", "tree", "timeline", "comparison"].includes(
      requestedLayoutMode
    )
      ? requestedLayoutMode
      : "graph";
    const nextPositions = {};
    let treeOffsetY = 60;

    researchTopics.forEach((topic, topicIndex) => {
      const topicNodeId = `topic-${topic.id}`;
      const topicFindings = findings.filter((finding) => finding.topic_id === topic.id);
      const graphTopicPosition = getTopicPosition(topicIndex);
      const rootPosition =
        activeLayoutMode === "tree"
          ? { x: 160, y: treeOffsetY }
          : activeLayoutMode === "timeline"
            ? { x: 100, y: 110 + topicIndex * 520 }
            : graphTopicPosition;

      nextPositions[topicNodeId] = rootPosition;

      topicFindings.forEach((finding, factIndex) => {
        const nodeId = `finding-${finding.id}`;
        const position =
          activeLayoutMode === "tree"
            ? { x: 160, y: rootPosition.y + 220 + factIndex * 230 }
            : activeLayoutMode === "timeline"
              ? { x: rootPosition.x + 340 + factIndex * 360, y: rootPosition.y }
              : activeLayoutMode === "comparison"
                ? {
                    x: rootPosition.x + (factIndex % 2) * 440,
                    y: rootPosition.y + 230 + Math.floor(factIndex / 2) * 230,
                  }
                : {
                x: rootPosition.x + (factIndex % 2) * 330,
                y: rootPosition.y + 230 + Math.floor(factIndex / 2) * 210,
                  };

        nextPositions[nodeId] = {
          x: Number.isFinite(position.x) ? position.x : 100,
          y: Number.isFinite(position.y) ? position.y : 100,
        };
      });

      if (activeLayoutMode === "tree") {
        treeOffsetY += Math.max(topicFindings.length, 1) * 230 + 330;
      }
    });

    if (socraticDraft) {
      const targetPosition = draftTargetFindingId
        ? nextPositions[draftTargetFindingId] || nodePositions[draftTargetFindingId]
        : null;
      const fallbackTopicIndex = Math.max(
        0,
        researchTopics.findIndex((topic) => topic.id === activeTopicId)
      );
      const fallback = getDraftPosition(fallbackTopicIndex, findings.length);
      const position = targetPosition
        ? { x: Number(targetPosition.x) + 340, y: Number(targetPosition.y) + 20 }
        : fallback;

      nextPositions["socratic-draft"] = {
        x: Number.isFinite(position.x) ? position.x : 100,
        y: Number.isFinite(position.y) ? position.y : 100,
      };
    }

    setNodePositions((currentPositions) => ({ ...currentPositions, ...nextPositions }));
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        const position = nextPositions[node.id];

        if (!position || node.type === "contextLayer") return node;

        return { ...node, position };
      })
    );
  }

  applyMagicLayoutRef.current = applyMagicLayout;

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

  const handleCheckout = useCallback(
    async (revision) => {
      try {
        setIsCheckingOut(true);
        setError("");
        const uiState = buildUiState();
        const response = await fetch(
          `${API_URL}/api/workspace/checkout/${encodeURIComponent(revision)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ui_state: uiState }),
          }
        );

        if (!response.ok) {
          throw new Error(await readError(response, "Не вдалося відновити revision."));
        }

        const data = await response.json();
        if (data?.ui_state) applyRestoredUiState(data.ui_state);

        setSelectedItem(null);
        setSocraticDraft(null);
        setDraftTargetFindingId(null);
        setDraftTopicId(null);
        await loadWorkspace();
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Не вдалося відновити revision."
        );
      } finally {
        setIsCheckingOut(false);
      }
    },
    [applyRestoredUiState, buildUiState, loadWorkspace]
  );

  const historyEntries = useMemo(
    () => [...workspaceHistory].sort((left, right) => right.revision - left.revision),
    [workspaceHistory]
  );

  const visibleProposals = useMemo(
    () =>
      activeTopicId
        ? proposals.filter((proposal) => proposal.topic_id === activeTopicId)
        : proposals,
    [activeTopicId, proposals]
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
          onOpenIngest={openNewTopic}
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
                  {visibleProposals.length}
                </span>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
              {isLoadingWorkspace ? (
                <p className="py-8 text-center text-sm text-slate-500">Loading inbox...</p>
              ) : visibleProposals.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 p-4 text-center text-sm text-slate-500">
                  {activeTopic
                    ? "Для цієї теми ще немає proposals. Додайте paper або інше джерело."
                    : "Inbox порожній. Створіть research topic, щоб почати аналіз."}
                </div>
              ) : (
                visibleProposals.map((proposal) => (
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
                    {proposal.source_title && (
                      <p className="mt-2 truncate text-[10px] font-semibold text-cyan-300/80">
                        Source: {proposal.source_title}
                      </p>
                    )}
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
            <div className="absolute left-4 top-4 z-10 max-w-[calc(100%-2rem)] rounded-lg border border-slate-700/80 bg-slate-900/90 px-3 py-2 backdrop-blur">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-cyan-400">
                Active research topic
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <select
                  value={activeTopicId || ""}
                  onChange={(event) => setActiveTopicId(event.target.value || null)}
                  className="max-w-56 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs font-semibold text-slate-200 outline-none focus:border-cyan-400"
                  aria-label="Active research topic"
                >
                  <option value="" disabled>
                    Select a topic
                  </option>
                  {researchTopics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={openNewTopic}
                  className="rounded-md border border-cyan-400/50 bg-cyan-400/10 px-2.5 py-1.5 text-xs font-extrabold text-cyan-200 transition hover:bg-cyan-400 hover:text-slate-950"
                >
                  + New topic
                </button>
                <button
                  type="button"
                  onClick={() => openSourceIngestion()}
                  disabled={!activeTopic}
                  className="rounded-md border border-emerald-400/50 bg-emerald-400/10 px-2.5 py-1.5 text-xs font-extrabold text-emerald-200 transition hover:bg-emerald-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  + Add paper
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Topic roots create evidence trails automatically. Switch to Manual to draw your own links.
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
              nodesDraggable={activeMode === "manual"}
              nodesConnectable={activeMode === "manual"}
              elementsSelectable={true}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
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
              <button
                type="button"
                onClick={handleDiscoverConnections}
                disabled={isDiscoveringConnections || !activeTopicId}
                className="mt-2 w-full rounded-lg border border-fuchsia-400/60 bg-fuchsia-400/10 px-3 py-2.5 text-xs font-extrabold text-fuchsia-200 transition hover:bg-fuchsia-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isDiscoveringConnections
                  ? "Discovering evidence links..."
                  : "✦ Discover Connections"}
              </button>
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
                        Workspace Snapshots
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Restore a previous verified Context Git state.
                      </p>
                    </div>
                    <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-[10px] font-bold text-cyan-300">
                      {historyEntries.length} revisions
                    </span>
                  </div>

                  {historyEntries.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-500">
                      Перший snapshot з’явиться після аналізу, Merge або зміни зв’язку.
                    </p>
                  ) : (
                    <ol className="mt-4 space-y-3 border-l border-cyan-500/30 pl-4">
                      {historyEntries.map((entry) => (
                        <li key={entry.revision} className="relative">
                          <span className="absolute -left-[1.34rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-slate-950 bg-cyan-400" />
                          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-bold text-slate-100">{entry.action}</p>
                              <span className="shrink-0 text-xs font-extrabold text-cyan-300">
                                r{entry.revision}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {entry.timestamp || "timestamp unavailable"}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleCheckout(entry.revision)}
                              disabled={isCheckingOut}
                              className="mt-3 rounded-md border border-cyan-400/50 bg-cyan-400/10 px-2.5 py-1.5 text-xs font-bold text-cyan-200 transition hover:bg-cyan-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isCheckingOut ? "Restoring..." : `Restore r${entry.revision}`}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
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
                            {(evidence.page_number || evidence.start_char !== undefined) && (
                              <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-cyan-300/80">
                                {evidence.page_number
                                  ? `Page ${evidence.page_number}`
                                  : "Text source"}
                                {evidence.start_char !== undefined
                                  ? ` · char ${evidence.start_char}`
                                  : ""}
                              </p>
                            )}
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
        ingestMode={ingestMode}
        activeTopicTitle={activeTopic?.title}
        query={query}
        setQuery={setQuery}
        text={text}
        setText={setText}
        sourceTitle={sourceTitle}
        setSourceTitle={setSourceTitle}
        sourcePageCount={sourcePageCount}
        setSourcePageCount={setSourcePageCount}
        isExtractingSource={isExtractingSource}
        onExtractFile={handleSourceExtraction}
        isAnalyzing={isAnalyzing}
        onAnalyze={handleResearch}
        onClose={() => setIsIngestModalOpen(false)}
        spotlightInputRef={spotlightInputRef}
      />
    </main>
  );
}
