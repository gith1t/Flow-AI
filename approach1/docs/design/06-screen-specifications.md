# Screen specifications

## 1. Public landing page

### Goal

Explain the product in one sentence, demonstrate the workspace-over-chat idea visually, and move qualified users toward trying or joining Yomirai.

### Header

- Transparent/near-black at top; gains `sumi-950` fill and hairline after scroll.
- Left: wordmark.
- Center/right: Product, How it works, Principles, optional Pricing.
- Primary action: “Start researching” or “Join the beta.”
- Secondary: “View demo.”
- Mobile: symbol/wordmark, primary CTA, accessible menu.

### Hero

Desktop composition uses a 12-column asymmetric grid:

- editorial eyebrow/micro-label;
- serif-led headline, approximately 56–72 px;
- concise product explanation;
- primary and secondary actions;
- a live-looking but deterministic product frame showing prompt → proposed objects → graph/timeline;
- one vermilion focal mark and subtle indigo evidence lines.

Suggested message:

> Research that becomes knowledge, not chat history.

Supporting copy:

> Yomirai turns questions, documents, and sources into cited, reviewable objects you can explore as a document, table, graph, or timeline.

The hero background uses layered near-black planes and faint grain. Do not use a red sun graphic.

### Problem section

Show the contrast between an endless transcript and a composed workspace. Use a split sequence:

- left: compact, fading transcript fragments;
- right: the same content resolving into findings, sources, questions, and relations;
- central annotation: “Chat is the interface. The workspace is the source of truth.”

### Product proof sequence

Three chapters:

1. **Ask naturally** — a focused command composer with explicit scope.
2. **Review the change** — a proposal diff with evidence.
3. **See the structure** — the same data in document/table/graph.

Each chapter contains one product claim, one screen detail, and one trust signal. Avoid a generic grid of twelve feature icons.

### Evidence/trust section

Demonstrate claim-level sources, contradictory evidence, and commit history. Use paper/indigo plates on the dark surface.

### Closing CTA

Large quiet section with generous `ma`, one sentence, primary action, and small privacy/product qualifier. Brass may appear as a fine rule or premium detail here, not a full CTA fill.

### Footer

Minimal columns, legal links, status/contact, and short product statement. Optional reviewed Japanese tagline may appear as secondary brand copy.

## 2. Authentication

- Centered 420–480 px lacquer panel on a dark atmospheric field.
- Wordmark and one-line purpose statement.
- Email/passkey/OAuth depending implementation.
- Clear privacy and terms links.
- No rotating testimonials or distracting hero animation.
- Errors remain inline and focus the relevant field.

On returning from authentication, restore the intended workspace/request safely.

## 3. Workspace library

### Goal

Let users resume meaningful work quickly.

### Layout

- Top bar with wordmark, global search, profile.
- Editorial heading: “Your research.”
- Primary action: New workspace.
- Recent workspaces as a restrained list or two-column cards.
- Each item shows title, goal excerpt, last activity, object/source counts, active-job state, and latest commit summary.
- Filter by recent, active research, archived.

Avoid decorative cover images for every workspace. Optional covers should be subtle color/material variations or user-selected content.

### Empty state

One strong statement, one product illustration demonstrating structured knowledge, and one create action. Offer 3 example research questions as text prompts, not template cards.

## 4. New workspace

### Step 1: research intent

- Large prompt field: “What are you trying to understand?”
- Workspace title suggested but editable.
- Optional scope details collapsed initially.

### Step 2: sources and constraints

- Add documents/URLs.
- Allow web or workspace-only.
- Optional geography/time/source restrictions.
- Short explanation of how sources and evidence will be stored.

### Step 3: start

- Summary of goal and source policy.
- Action: “Create workspace” or “Create and begin research.”

This may be one progressive page rather than three full-screen steps. Preserve data on back/navigation.

## 5. Empty workspace overview

- Stable application shell.
- Research goal as a 32–40 px editorial heading.
- Small workspace status and source count.
- Command dock prominent at bottom.
- Three starting actions: begin research, add sources, create object.
- Faint coordinates/empty graph area suggest future structure without visual noise.

The explorer already contains starter views: Overview, Findings, Sources, Questions, History. Empty views explain what will appear.

## 6. Active research workspace

### Overview canvas

- Executive summary block if one exists.
- “Current understanding” with key findings and evidence coverage.
- Local relation map around high-importance objects.
- Open questions and conflicts.
- Recent source additions and commits.
- Active/queued research job compact module.

Cards vary in scale according to importance, but align to a clear grid. Use one editorial heading and otherwise dense sans typography.

### Command dock

Scope defaults to workspace. Selected objects immediately update scope copy. User can choose web/document restrictions before running.

## 7. Research job activity

The activity drawer expands from the command dock.

Header:

- request summary;
- started time and cost/budget indicator if exposed;
- minimize and cancel.

Body:

- stage list: planning, gathering, extracting, synthesizing, validating;
- current observable action;
- selected/consulted sources with status;
- warnings such as unavailable sources or uncovered questions;
- partial results only when they are safe to inspect.

Footer:

- “Continue in background” when leaving;
- completion action becomes “Review 17 changes.”

Do not block other manual workspace activity while the job runs.

## 8. Proposal review

### Header

- concise outcome summary;
- base workspace version and staleness status;
- counts: additions, updates, relations, evidence, warnings;
- filter decisions and operation type.

### Left change navigator

- grouped by outcome/object;
- tri-state group accept control;
- operation label and evidence status;
- warning/dependency indicator;
- keyboard list navigation.

### Main preview

Changes render in their natural form:

- finding as current/proposed prose and evidence;
- relation as readable triple and graph preview;
- event on local timeline;
- view as a lightweight preview;
- merge as identity comparison.

### Inspector/evidence

Evidence plate opens alongside the diff. Users can move among source spans without losing the selected operation.

### Apply bar

- sticky at bottom;
- selected counts and consequences;
- Discard, Save review for later, Apply changes;
- warning before applying operations with unresolved semantic issues;
- conflict response offers rebase/review, never silent retry.

## 9. Document view

### Layout

- Readable 760–880 px central column.
- Optional outline rail inside canvas.
- Embedded canonical objects display kind/status and can open inspector.
- Citation markers are visible, keyboard reachable, and open evidence beside text.
- Section spacing uses editorial rhythm rather than card borders.

### Editing

- Slash commands may insert supported block/object references after implementation.
- AI edits always enter proposal state unless explicitly configured otherwise.
- Manual text/object edits create a normal commit.
- Selection toolbar offers ask/explain/turn into finding/link source.

## 10. Table view

- Compact header showing query scope and row count.
- Filter/sort/group controls in toolbar.
- Sticky headers and virtualized rows.
- Object kind/status/evidence columns use icon plus text.
- Multi-select opens batch inspector and contextual command scope.
- Proposed changes can be previewed inline with cell-level diff.
- Empty filtered result distinguishes “no data exists” from “filters exclude all.”

## 11. Graph view

### Default state

- Start with a seed/selection and two-hop maximum neighborhood.
- Canvas uses `sumi-950` with an extremely subtle coordinate grid.
- Labels and edges meet contrast requirements at default zoom.
- Inspector opens for nodes and relations.

### Toolbar

- search/jump to object;
- zoom to fit;
- relation depth;
- kind/relation filters;
- layout;
- show as list;
- save view.

### Context behavior

- Hover/focus emphasizes immediate neighborhood.
- Clicking blank canvas clears selection, not current view.
- Double activation opens object detail.
- Expand action adds one neighborhood ring.
- Proposed nodes/edges are visually distinct until committed.

## 12. Timeline view

- Horizontal time for wide desktop; vertical chronological list on narrow screens.
- Zoom from decade/year/month depending data.
- Uncertain dates use ranges or fuzzy edges with explicit label.
- Selecting an event opens evidence and relations.
- Clusters summarize crowded periods and expand on activation.
- Current viewport range is announced for assistive technology.

## 13. Source reader

### Split composition

- Left/main: source content or sanitized preview.
- Right: metadata, evidence spans used, related findings, and processing status.
- Page/section locator remains visible.
- Search within source and next/previous evidence controls.

### Evidence highlight

Use indigo background/edge with sufficient text contrast. Supporting versus contradicting relation uses label and icon. User can propose a new finding or attach span to an existing object.

For unavailable web content, show stored metadata/snapshot policy clearly without pretending the original page is live.

## 14. Commit history

- Chronological list with version, actor, origin, and operation summary.
- Select commit to see structured diff.
- Filter human, AI-originated, source ingestion, and revert.
- Revert action explains it creates a new compensating commit.
- Current workspace version is always visible.

The visual metaphor may reference archival ledgers through typography and rules, but function remains modern and searchable.

## 15. Settings

Sections:

- profile and language;
- appearance and density;
- AI/research preferences and budgets;
- source and provider storage policy;
- workspace members when supported;
- export/deletion;
- keyboard shortcuts;
- accessibility: reduce motion, graph simplification, contrast.

Use a standard left settings navigation and narrow form column. Settings should be visually quieter than the research workspace.

## 16. Error and offline states

- Provider outage: manual work remains available; jobs show queued/retry state.
- Lost stream: reconnect indicator and job polling; no duplicate request.
- No permission: explain whether the workspace/object exists only when safe.
- Version conflict: show affected objects and preserve local decisions.
- Offline/manual mode: clear banner, queued safe local actions only if implementation supports reliable sync.
- Fatal page error: retain shell and offer retry/navigation; include support trace ID.

Errors use direct language and a corrective action. Avoid dramatic full-screen red treatments.
