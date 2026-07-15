# Delivery roadmap

## Delivery strategy

Build vertical slices that exercise the real domain model early. Do not spend the first months building an elaborate canvas before proving proposal review and trusted commits.

The phases below are capability gates, not calendar promises. Team size, design readiness, and provider evaluation results determine timing.

## Phase 0 — Product and technical validation

### Goals

- Validate that users prefer structured results over long answers.
- Test proposal/diff comprehension with a clickable prototype.
- Establish domain contracts and evaluation fixtures.

### Deliverables

- interactive UX prototype for explorer/canvas/inspector/activity drawer;
- five research scenarios in different domains;
- initial JSON Schemas for router result and operations;
- 50-task golden evaluation dataset outline;
- architecture spike for Responses API structured output, web citations, and cancellation;
- threat-model review.

### Exit criteria

- 5–8 target users can create/apply a proposal without explanation;
- users can find a prior finding and its evidence faster than in a chat transcript baseline;
- operation model handles all prototype scenarios without domain-specific actions;
- current model candidates meet minimum structured-output and claim/evidence quality.

## Phase 1 — Trustworthy workspace kernel

### Goals

Ship useful manual workspace management and version history before autonomous research.

### Scope

- authentication and one-user workspaces;
- object, relation, source, evidence, and view persistence;
- manual create/update/archive;
- commits and history;
- document/table views;
- graph view for local neighborhoods;
- lexical search;
- proposal creation from fixture/manual operations;
- apply, partial apply, discard, and conflict handling.

### Exit criteria

- every mutation produces an atomic commit;
- stale proposals cannot overwrite newer revisions;
- views show the same canonical data;
- workspace isolation and operation invariants are covered by tests;
- manual research work is usable even with AI disabled.

## Phase 2 — AI-assisted editing and workspace Q&A

### Goals

Prove the main interaction model without web research complexity.

### Scope

- assistant request router;
- non-persistent answer mode;
- focused context builder over workspace state;
- direct proposal mode for create/update/organize commands;
- structured output and deterministic validation;
- proposal review UX with model rationale and user editing;
- prompt/model version records;
- initial offline eval suite and trace UI for developers.

### Representative tasks

- “Summarize these five findings.”
- “Group selected notes into themes.”
- “Turn unresolved claims into questions.”
- “Create a graph view around this event.”
- “What did we conclude about X?”
- “What is a syrnyky recipe?” → answer, no persistence.

### Exit criteria

- routing and persistence evals meet threshold;
- no model output can bypass the commit path;
- proposal rejection/edit telemetry is available;
- selected-scope requests do not leak unrelated workspace material;
- median direct proposal latency is acceptable in usability tests.

## Phase 3 — Document research

### Goals

Make uploaded-source research evidence-first and traceable.

### Scope

- secure uploads and object storage;
- PDF/HTML/text parsing with page/section locators;
- chunking, embeddings, and hybrid retrieval;
- document-only research jobs;
- evidence extraction and citation inspector;
- source deduplication and parser/index versions;
- background progress, cancellation, retry, and partial-failure behavior;
- claim/evidence and injection eval suites.

### Exit criteria

- citations reliably open the correct document location;
- document instructions cannot trigger tools or mutations;
- ingestion limits and quarantine behavior are verified;
- retrieval/evidence evals meet thresholds across supported formats;
- deletion removes originals, derivatives, index records, and provider artifacts.

## Phase 4 — Cited web research beta

### Goals

Deliver the full research-job loop while keeping scope and cost bounded.

### Scope

- research planner and persisted job state machine;
- provider web search with normalized sources/citations;
- bounded search/read loop and stop evaluator;
- source policy, canonicalization, and conflict handling;
- synthesis into findings, events, relations, and views;
- optional timeline view;
- per-job budgets, usage display, and provider circuit breakers;
- verification pass for claim/evidence alignment;
- beta export of source list and Markdown summary if capacity permits.

### Exit criteria

- end-to-end evals meet usefulness and factual-support targets;
- users can understand source provenance and unresolved conflicts;
- runaway jobs are prevented by enforced budgets;
- retries and cancellation are idempotent;
- applied web-research proposals show acceptable edit/revert rates.

## Phase 5 — Collaboration and automation, only after validation

Candidates:

- multi-user membership and comments;
- approval policy and low-risk auto-apply;
- scheduled monitoring and change detection;
- richer comparison/table blocks;
- dataset ingestion and sandboxed analysis;
- export to Markdown/PDF/DOCX/slide deck;
- integrations through connectors/MCP;
- reusable workspace templates;
- branch/merge or CRDT collaboration if concurrent editing demands it.

Each candidate requires its own security and product case. None is necessary to validate the MVP thesis.

## Initial backlog by vertical slice

### Slice A — One manual finding

Create workspace → add finding → attach manual source/evidence → see in document/table → commit → inspect history.

### Slice B — One AI proposal

Select notes → ask AI to create one finding → validate → preview diff → edit → apply → inspect trace and commit.

### Slice C — One document answer

Upload PDF → parse/index → ask non-persistent question → open citation at page → save answer as proposed finding.

### Slice D — One document research job

Ask comparison question across documents → stream progress → receive evidence-backed proposal → partially apply.

### Slice E — One web research job

Ask bounded research question → search/read/synthesize → inspect cited sources → apply → view graph/timeline.

These slices should stay working continuously; they form the primary end-to-end test suite.

## Decisions required before coding

The architecture is ready to begin implementation, but the product owner should explicitly choose:

1. first target persona and primary research scenario;
2. supported upload types for the first document milestone;
3. whether provider-side storage is disabled by default;
4. budget/latency target for direct proposals and research jobs;
5. whether the first beta is single-user only;
6. hosting region and data-retention expectations;
7. visual design direction and graph library constraints.

These choices tune the implementation; they do not change the core architecture.

## Definition of MVP done

The MVP is done when a user can:

1. create a workspace around a real research goal;
2. add documents and run a bounded cited research job;
3. receive a structured, reviewable proposal rather than a long answer;
4. inspect claim-level evidence and unresolved conflicts;
5. partially apply changes into canonical objects;
6. explore the same data in document, table, and graph views;
7. return later, ask a follow-up without replaying the full chat, and build on prior work;
8. inspect and revert the resulting commit.

The system must also demonstrate workspace isolation, safe cancellation/retry, cost limits, and passing release-gate evals.
