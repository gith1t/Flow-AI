# User experience

## Interaction model

The primary screen has four stable regions:

1. **Explorer** — workspace navigation, saved views, object filters, documents, and recent commits.
2. **Canvas** — the selected document, table, graph, timeline, or object detail.
3. **Inspector** — properties, relations, evidence, provenance, and history for the current selection.
4. **Command bar/activity drawer** — natural-language input, job progress, concise answers, and proposed changes.

Chat does not occupy the center of the product. It is available everywhere as a command surface and activity log.

```text
+----------------+--------------------------------------+------------------+
| Explorer       | Canvas                               | Inspector        |
|                |                                      |                  |
| Overview       | [Document | Table | Graph | Timeline]| Properties       |
| Findings       |                                      | Relations        |
| Sources        | Selected view of workspace objects   | Evidence         |
| Questions      |                                      | History          |
| Commits        |                                      |                  |
+----------------+--------------------------------------+------------------+
| Ask, research, compare, or edit...        [scope] [run]                  |
+-------------------------------------------------------------------------+
```

## Three response modes

Every user request resolves to exactly one top-level mode.

### Answer

Use for explanation, navigation, and low-impact questions that should not change workspace state.

Example: “What does this finding mean?”

The assistant provides a concise answer with object links and citations where relevant. It may offer “Save as note” or “Turn into question,” but nothing is persisted automatically.

### Proposal

Use when the user requests a bounded workspace mutation and the necessary information is already available.

Example: “Group these findings by cause and add two open questions.”

The assistant returns a change set. The canvas can preview the resulting state; the activity drawer shows atomic operations. The user can apply, edit, partially apply, or discard it.

### Research job

Use when the request needs web search, document retrieval, or several bounded reasoning/tool steps.

Example: “Research the main causes of the 2022 European energy-price spike and build a cited timeline.”

The system creates a job, streams stage-level progress, and ends with a proposal. Research does not bypass review merely because it ran in the background.

## Request scope

The input shows and allows editing the current scope:

- entire workspace;
- selected objects;
- current view;
- chosen documents;
- web plus workspace;
- workspace only.

The system must never silently broaden a restricted scope. If the request requires sources outside it, the assistant asks for permission or explains the limitation.

## New workspace flow

1. User selects **New workspace**.
2. User enters a goal, such as “Understand the causes and consequences of the 2008 financial crisis.”
3. Optional fields capture scope, region, time range, desired output, and source restrictions.
4. The system creates an empty workspace plus starter views.
5. The initial request becomes either a research job or a small planning proposal.
6. The user reviews the first change set.
7. Applying it creates the first commit and populates views.

Avoid an elaborate template chooser at launch. A small set of suggested prompts is sufficient.

## Example end-to-end flow

User request:

> Research why the Aral Sea shrank. Separate direct causes from policy decisions, create a timeline, and cite primary or institutional sources where possible.

### During the job

The activity drawer shows meaningful stages rather than model chain-of-thought:

- Planning research questions
- Searching for sources
- Reading 8 of 12 selected sources
- Extracting candidate evidence
- Checking duplicate and conflicting claims
- Preparing 17 proposed changes

The UI may show searched queries and consulted sources, but never hidden reasoning.

### Result

The proposed change set might contain:

- 5 entities: Aral Sea, Amu Darya, Syr Darya, Soviet government, irrigation projects;
- 7 findings, each typed as sourced fact or inference;
- 9 relations;
- 6 timeline events;
- 10 source records and 18 evidence spans;
- 3 unresolved questions;
- 1 graph view and 1 timeline view configuration.

The user opens a finding, sees its evidence, removes one weak source, edits the wording, and applies the rest. The resulting commit records the partial acceptance and user edit.

## Proposal UX

A proposal is a first-class object with these sections:

- summary of intended outcome;
- affected objects and views;
- additions, updates, links, merges, and archives;
- warnings and unresolved references;
- evidence coverage;
- estimated impact, such as “2 saved views will include these new findings.”

Operation states are `proposed`, `accepted`, `edited`, `rejected`, `invalid`, or `superseded`.

For low-risk operations, users can enable auto-apply later. MVP defaults:

| Operation | Default |
| --- | --- |
| Create personal note explicitly requested by user | Review |
| Rename selected object | Review with one-click apply |
| Add sourced finding | Review |
| Add relation | Review |
| Merge objects | Review with warning |
| Archive object | Review with dependency warning |
| Delete source/evidence | Never auto-apply |
| Change permissions or external data | Not supported by AI |

## Visual views

Views are saved queries plus layout configuration. They reference canonical objects.

### Document view

Best for narrative synthesis. It contains blocks that embed objects or query results. Editing an embedded finding edits the canonical finding, subject to normal versioning.

### Table view

Best for comparison, triage, and bulk review. Columns map to canonical fields or selected JSON properties. Sorting and filtering remain deterministic.

### Graph view

Best for relations and local context. Default behavior should show a selected node and a limited neighborhood, not the entire workspace “hairball.” Edge labels and evidence access are mandatory.

### Timeline view

Best for events or findings with normalized date ranges. It should not infer dates during rendering; date extraction occurs as a proposal beforehand.

## Simple or unrelated requests

If a user asks “What is a good syrnyky recipe?” while a workspace is open, the router should normally choose `answer` with `persistence: none`. The answer appears in the activity drawer and does not alter the research.

The user may explicitly choose **Save to workspace**, after which the assistant proposes an appropriate note or source-backed object. The product does not need a separate global-chat architecture for MVP; non-persistent answers cover the essential behavior.

## Empty, loading, and failure states

- Empty views explain what objects they display and offer one relevant action.
- Jobs show cancel and “continue in background” options.
- Partial tool failures preserve successful evidence and clearly label gaps.
- A failed proposal application makes no partial commit unless operations were explicitly split into independent groups.
- Conflicts show current state, proposal base version, and suggested resolution.
- Rate-limit or provider errors never appear as invented model prose; they are typed application errors.

## Accessibility and responsiveness

- All graph actions have a keyboard/list equivalent.
- Color never carries evidence status or confidence alone.
- Proposal diffs are screen-reader navigable and usable without drag-and-drop.
- The mobile experience prioritizes reading, asking, reviewing, and applying; complex graph editing can remain desktop-first.
