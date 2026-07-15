# Product brief

## Product thesis

Long AI conversations are a poor data-management interface. Useful facts, decisions, sources, and unresolved questions become trapped in chronological prose. Users can ask follow-up questions, but they cannot reliably inspect, reorganize, compare, or version the accumulated knowledge.

Yomirai turns AI interaction into workspace operations. A user can still ask natural-language questions, but durable results become structured objects with provenance. One knowledge base can be rendered in several visual forms without duplicating its data.

The product is best understood as a **research IDE**, not as a general chatbot with a notes panel.

## Best approach from the original discussion

The conversation identified several strong ideas, but some should be combined and others postponed.

### Keep

- Workspace as the durable source of truth.
- Chat/command input as a convenient way to query and edit the workspace.
- Universal knowledge primitives instead of domain-specific actions.
- Reviewable proposed changes before persistence.
- Sources and evidence attached to claims, not merely listed at the end of an answer.
- Multiple views over the same underlying data.
- Version history for AI and human changes.
- A separate transient answer path for requests that do not belong in the workspace.

### Refine

- Do not make every item an undifferentiated `Entity`. A small set of semantic object kinds improves validation and UX: `entity`, `finding`, `note`, `question`, `task`, `event`, `document`, `dataset`, and `source`.
- Do not model every edit as a large JSON document replacement. Use domain commands and atomic operations so changes can be validated, reviewed, merged, and reverted.
- Do not use chat history as model memory. Retrieve a task-specific context bundle from the workspace and include recent interaction only when relevant.
- Do not automatically persist everything. The system should return one of three explicit outcomes: answer, proposal, or research job.

### Postpone

- Multiple specialized agents.
- A graph database.
- CRDT collaboration.
- Autonomous recurring monitoring.
- General Python sandbox and arbitrary SQL execution.
- Dozens of workspace templates and domain-specific schemas.
- Automatic view generation without user confirmation.

These are plausible later capabilities, but each adds a large reliability or security surface before the core data-management behavior is proven.

## Target user

The initial user is an individual knowledge worker who conducts multi-session research and needs to retain traceable conclusions:

- product or market researcher;
- analyst or consultant;
- journalist or OSINT researcher working only with authorized, lawful sources;
- student or independent researcher;
- founder synthesizing a problem space.

The MVP is not aimed at casual one-shot chat, enterprise BI, regulated medical/legal decision support, or real-time team collaboration.

## Jobs to be done

1. When I investigate a topic across multiple sessions, help me preserve findings and sources without rereading a long chat.
2. When the AI discovers or infers something, show me the evidence and let me decide whether it becomes part of my workspace.
3. When I need to understand the same material differently, let me switch between document, table, graph, and timeline views without recreating it.
4. When information changes, show exactly what changed and let me recover an earlier state.
5. When I ask a simple unrelated question, answer it without polluting the workspace.

## MVP capabilities

### 1. Workspace knowledge kernel

- Create a workspace with a research goal and optional constraints.
- Add or edit typed objects and relations manually.
- Upload source documents and capture web sources.
- Attach evidence spans to findings.
- Search and filter workspace content.
- Render document, table, and graph views over the same objects.

### 2. AI change sets

- Ask a question or issue an edit/research command.
- Receive a short direct answer, a proposed change set, or a background research job.
- Inspect additions, updates, merges, and archive operations.
- Apply all, apply selected changes, edit before applying, or discard.
- Create an immutable commit recording actor, request, operations, and provenance.
- Revert a commit by producing a compensating commit.

### 3. Evidence-first research

- Use web research and uploaded documents.
- Store source metadata and normalized evidence excerpts.
- Require source-backed findings when the claim is presented as externally verifiable.
- Mark unsupported AI synthesis as an inference or hypothesis.
- Expose conflicts rather than silently choosing one value.

## Non-goals for MVP

- Replacing ChatGPT for every general-purpose request.
- Fully autonomous research with no user review.
- Guaranteeing factual truth; the product manages evidence and uncertainty.
- Building a general no-code database platform.
- Supporting live multi-user editing.
- Executing arbitrary user code or mutating external systems.
- Producing publication-ready PDF/slide exports.

## Product principles

1. **Workspace over transcript** — messages explain actions; objects hold knowledge.
2. **Evidence over confidence theatre** — show why a claim exists. A numeric confidence score is secondary and must be explainable.
3. **Proposal before mutation** — model output is untrusted until validated and accepted by policy or user.
4. **One dataset, many views** — views select and arrange objects; they do not fork the facts.
5. **Progressive automation** — start with explicit user approval and earn automation through observed reliability.
6. **Visible uncertainty** — distinguish sourced fact, quotation, inference, hypothesis, and user assertion.
7. **Reversible operations** — archive rather than hard-delete in normal flows; keep an audit trail.
8. **Provider independence at the domain boundary** — OpenAI powers reasoning and tools, but workspace semantics live in Yomirai.

## Success metrics

### Activation

- A new user creates a workspace, runs a research command, and applies at least one cited change set.
- Median time from workspace creation to first useful applied finding is under five minutes.

### Core value

- At least 50% of active workspaces are reopened on a later day.
- Users open a non-chat view in at least 60% of research sessions.
- At least 70% of AI-proposed findings that users keep have one or more evidence links.
- Users can locate a previously created finding in under 30 seconds in usability tests.

### Trust and quality

- Fewer than 1% of applied operations violate domain invariants.
- Citation-to-claim entailment passes the agreed evaluation threshold before beta.
- Proposal acceptance, partial acceptance, edit, and rejection rates are tracked by operation type.
- No workspace mutation occurs without an auditable actor and commit.

## Product risks

| Risk | Why it matters | Early mitigation |
| --- | --- | --- |
| The UI becomes a complex Notion clone | Scope expands before AI value is proven | Limit object kinds and views; no custom schemas in MVP |
| AI creates clutter | Structured noise is still noise | Proposal review, deduplication, conservative extraction |
| Citations do not support claims | Trust collapses | Evidence-level storage, claim/evidence evals, visible inference labels |
| Research feels slow | Users return to ordinary chat | Stream progress, quick answer path, background jobs for long work |
| Graph view looks impressive but is unusable | Visual novelty does not equal utility | Default to filtered local neighborhoods and semantic grouping |
| Provider state becomes the product database | Portability and deletion become difficult | Persist normalized domain data and execution metadata separately |

## Positioning

Potential positioning statement:

> Yomirai is a visual research workspace where AI turns questions into cited, reviewable, structured knowledge—so your work compounds instead of disappearing into chat.
