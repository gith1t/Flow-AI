# Application shell

## Shell objective

The shell must make a complex research workspace feel stable. Objects and views may change; the primary navigation regions do not. Users should always know:

- which workspace and view they are in;
- what content is selected;
- what the AI is doing;
- which changes are proposed versus committed;
- how to return to the previous state.

## Desktop composition

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ Mark  Workspace / View       Search                 Activity   Profile     │
├───────────────┬─────────────────────────────────────────┬──────────────────┤
│ Explorer      │ Canvas                                  │ Inspector        │
│               │                                         │                  │
│ Overview      │ View toolbar                            │ Object identity  │
│ Views         │ ──────────────────────────────────────  │ Properties       │
│ Sources       │                                         │ Evidence         │
│ Objects       │ Canonical workspace content             │ Relations        │
│ Questions     │                                         │ History          │
│               │                                         │                  │
│ Recent        │                                         │                  │
├───────────────┴─────────────────────────────────────────┴──────────────────┤
│ Ask or command Yomirai…       Scope: Selection      Tools: Workspace  Run │
└────────────────────────────────────────────────────────────────────────────┘
```

The canvas is the highest-contrast and visually dominant region. Explorer and inspector are one tonal level quieter. The command dock floats slightly above the lower boundary when active.

## Top bar

### Contents

Left:

- Yomirai symbol;
- workspace breadcrumb;
- current saved view title;
- unsaved local-layout indicator when applicable.

Center:

- global/workspace search trigger;
- keyboard shortcut hint when idle.

Right:

- background activity indicator with count;
- notifications limited to meaningful research events;
- share/collaboration placeholder only when supported;
- profile and workspace menu.

### Visual behavior

- Height: 52 px.
- Background: `sumi-950` with a single bottom hairline.
- The wordmark is shown on marketing and workspace switcher; inside a workspace use the compact symbol to preserve space.
- Breadcrumb segments truncate from the middle and expose full names in tooltip/focus detail.
- The bar remains fixed and does not cast a heavy shadow.

## Explorer

The explorer organizes stable destinations rather than acting as a second canvas.

### Sections

1. **Workspace** — overview and research goal.
2. **Views** — document, table, graph, and timeline saved views.
3. **Knowledge** — findings, entities, questions, tasks.
4. **Sources** — web sources, uploaded documents, datasets.
5. **History** — proposals and commits.
6. **Recent** — last opened objects, context-aware and capped.

### Hierarchy

- Section labels use `label` typography with secondary color.
- Destinations use 32–36 px rows.
- Active destination has a quiet surface change and a 2 px vermilion leading mark.
- Counts use tabular figures with tertiary contrast.
- Nested items indent by 16 px and use connecting guides only while expanded.

### Collapse behavior

At 52 px rail width, show top-level icons with tooltips and preserve active-state markings. Opening an item temporarily expands a floating explorer; pinning restores full width.

Do not collapse automatically merely because the inspector opens. Respect the user’s saved layout unless the canvas would fall below minimum width.

## Canvas

The canvas changes by view type but maintains shared structure:

1. view header;
2. view toolbar;
3. content viewport;
4. optional inline context or selection toolbar;
5. command dock overlay boundary.

### View header

Contains title, description/goal, object count or freshness, and compact status. It should not repeat navigation already visible in the explorer.

Workspace cover/overview may use more editorial serif typography and negative space. Dense saved views use compact sans headings.

### View toolbar

Left:

- view-type switcher when representations are compatible;
- back/forward view history;
- saved filter indication.

Right:

- search within view;
- filter, sort, group;
- display settings;
- overflow actions.

Toolbar height: 44 px. Use icon-plus-label for unfamiliar actions and icon-only controls only when meaning is standard and tooltip-accessible.

### Selection

Selection is a first-class cross-view state:

- one object opens inspector detail;
- multiple objects open batch summary and contextual commands;
- selection persists when switching compatible views;
- opening a different workspace clears selection;
- Escape clears the latest selection layer before closing larger surfaces.

## Inspector

The inspector answers “what is this, why is it here, and can I trust it?”

### Header

- object-kind icon and label;
- editable title;
- epistemic/status badge;
- close and overflow actions.

### Tabs or stacked sections

Default structure:

- **Details** — body, typed properties, aliases, tags;
- **Evidence** — supporting/contradicting spans and source quality;
- **Relations** — incoming and outgoing relations;
- **History** — revisions, originating proposal/commit, actor;

Use tabs at widths below 340 px; at wider inspector widths, allow collapsible stacked sections. Evidence receives priority for findings and relations.

### Editing

- Click field to enter controlled edit mode.
- Manual edits save through the same commit model as AI changes.
- Show unsaved state locally and confirmation only for navigation that would lose work.
- For AI-proposed objects, the inspector becomes a review surface with proposed/current comparison.

## Command dock

The command dock is Yomirai’s conversational interface, but it should feel like a professional command composer rather than a chat bubble row.

### Resting state

- Width aligns with the canvas rather than the full browser.
- Height: 56–64 px.
- Elevated `sumi-850` surface with 16 px radius and subtle shadow.
- Placeholder: “Ask, compare, organize, or research…”
- Scope control is always visible.
- Run action uses a vermilion glyph/edge, not a large red rectangle.

### Expanded composer

Expands upward to include:

- multiline input;
- selected object/file chips;
- scope and source policy;
- desired output shortcut: answer, propose changes, or research;
- estimated “quick” versus “deep” mode if product policy supports it;
- tool permissions summary;
- recent reusable prompt actions.

The input remains the first focus target. Options are keyboard reachable and do not shift unpredictably while typing.

### Activity drawer

After submission, the dock can expand into an activity drawer with:

- user request summary;
- current job stage;
- consulted-source count;
- observable progress log;
- cancel/background action;
- final short answer or change-set summary.

It does not display chain-of-thought. The user can minimize it without interrupting the job.

## Proposal review mode

Proposal review is a shell state, not a generic modal. It may use the full canvas while preserving explorer context.

```text
┌───────────────────────────────┬────────────────────────────────────────────┐
│ Change list                   │ Preview / detail                           │
│                               │                                            │
│ + 5 findings                  │ Current            Proposed                │
│ + 9 relations                 │ ─────────          ─────────                │
│ ~ 2 objects                   │ Object/evidence diff                       │
│ + 1 graph view                │                                            │
│ ! 3 warnings                  │ Why + evidence + dependencies              │
│                               │                                            │
├───────────────────────────────┴────────────────────────────────────────────┤
│ 14 accepted · 2 edited · 1 rejected            Discard     Apply changes │
└────────────────────────────────────────────────────────────────────────────┘
```

### Review behavior

- Group operations by user outcome or object, not raw execution order.
- Show `+`, `~`, archive, merge, and warning glyphs with labels.
- Selecting an operation previews its effect in the appropriate view.
- Evidence links open beside the diff without losing review state.
- Accept/reject controls support keyboard batch actions.
- Applying remains a deliberate action with count and consequence summary.
- Conflict/stale-state errors preserve all review decisions for rebase.

Vermilion identifies active proposed change; indigo identifies evidence; destructive red is reserved for actual data loss/archive consequences.

## Navigation model

### Global

- Workspace switcher: symbol/wordmark menu or `Cmd/Ctrl+K`.
- Global search: searches workspaces and allowed recent objects.
- Browser back/forward: navigates semantic screens and object openings.

### Workspace

- Explorer destinations change the canvas.
- Object links open inspector while preserving canvas.
- `Enter` may open selected object as the full canvas.
- `Cmd/Ctrl+Enter` submits command; plain Enter adds a line in multiline mode.
- `Cmd/Ctrl+Shift+P` opens action/command palette if implemented.

### History

Maintain separate concepts:

- browser/navigation history;
- workspace commits;
- AI activity/job history;
- object revision history.

Do not merge them into one ambiguous “History” list. Explorer may group them under one heading with distinct sub-destinations.

## Density modes

Offer two density modes after the basic design stabilizes:

- **Comfortable** — default, 40 px rows, more description and larger hit targets;
- **Compact** — 32 px rows for experienced analysts and large tables.

Spacing changes; typography never becomes illegibly small. Density is a user preference, not automatically inferred.

## Empty shell state

A new workspace should feel purposeful, not blank:

- display the research goal as an editorial heading;
- show a faint, minimal graph coordinate field or paper frame;
- present three specific starting actions: add sources, begin research, create manually;
- keep the command composer prominent;
- show one sentence explaining that results become reviewable workspace objects.

Avoid a grid of ten template cards before users understand the core workflow.
