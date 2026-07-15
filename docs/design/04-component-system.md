# Component system

## Component principles

Components should expose hierarchy through structure, not decoration. Every component needs:

- default, hover, focus, pressed, selected, disabled, loading, and error states where applicable;
- keyboard interaction and visible focus;
- light/dark semantic token compatibility even if dark ships first;
- support for English and Japanese text expansion;
- deterministic behavior for proposal versus committed state;
- reduced-motion behavior.

## Buttons

### Primary

Use for one main action per region: create workspace, run request, apply changes.

- Height: 36 px compact, 40 px default, 44 px large.
- Background: vermilion.
- Text: warm near-white.
- Radius: 6–10 px.
- Hover increases luminance slightly; pressed lowers by 1 px/tonal shift.
- Do not add glow.

For the command dock, the primary action may be an icon button with a vermilion edge/fill to avoid a visually dominant rectangular CTA during long sessions.

### Secondary

Panel-toned background with subtle border. Use for review, filters, and supporting actions.

### Quiet/ghost

No background at rest. Hover reveals a surface. Use for toolbars and object actions.

### Destructive

Outlined or quiet by default; filled only in final confirmation. Label the consequence specifically: “Archive 3 objects,” not “Confirm.”

## Inputs

### Text input

- 40 px default height; 36 px in dense tables.
- Label outside or persistent floating label—never placeholder-only for required data.
- Background differs slightly from surrounding panel.
- Focus uses the shared ring and stronger edge.
- Error includes icon, message, and `aria-describedby` relationship.

### Command composer

The composer is a specialized multiline input with:

- auto-grow from one to approximately eight lines;
- attached scope/source chips;
- slash/action suggestions only when invoked or clearly relevant;
- file drop zone activated during drag;
- submission shortcut shown contextually;
- no chat-style speech-bubble chrome.

### Search

Search displays result category, highlighted match, workspace/view context, and keyboard selection. Semantic search must distinguish exact and related results when that matters.

## Menus, popovers, and dialogs

### Menu

- 32–36 px rows;
- grouped actions separated by spacing or one subtle rule;
- shortcuts aligned right in mono/secondary text;
- destructive action last and visually separated;
- submenus avoided where a searchable command palette works better.

### Popover

Use for filters, compact properties, date/source settings. Position relative to trigger and keep open during internal interaction. Close on Escape and return focus.

### Dialog

Use for focused, consequential decisions or short creation flows. Avoid using modal dialogs for object browsing, source evidence, or proposal review; those belong in the shell.

Dialog width: 440–640 px standard. Complex creation may reach 760 px but should be a page/side sheet if it grows further.

## Tabs and segmented controls

- Tabs switch peer content and preserve each panel’s state.
- Active tab uses text contrast plus a 2 px vermilion underline/indicator.
- Segmented controls switch compact representations such as view type.
- Do not use pill-shaped segmented controls for primary navigation.
- Overflow tabs become a scrollable list or menu without shrinking labels below legibility.

## Knowledge object row/card

The canonical object component appears in search, tables, graph inspector, and proposals.

### Anatomy

- kind icon;
- title;
- optional one- or two-line summary;
- epistemic status;
- evidence coverage/count;
- last modified or date when relevant;
- relation/source count as secondary metadata;
- selection and contextual actions.

### Visual state

- Committed objects use neutral surfaces.
- Proposed creation has a vermilion leading marker and faint warm tint.
- Proposed update shows old/new indication and revision base.
- Disputed object uses plum status and conflict glyph.
- Weak/absent evidence uses warning icon with text label, not an alarming full red card.
- Archived objects are muted and struck only where meaning remains clear.

Cards are used for overview/gallery contexts. Dense object lists and comparison surfaces use rows.

## Finding component

A finding must make its epistemic status and support easy to inspect.

```text
Finding title                                    [Sourced fact]
Short finding body or conclusion…

Evidence  3 supporting · 1 contradicting        Updated 2h ago
Source quality: Institutional + scholarly
```

Interaction:

- clicking the title opens details;
- clicking evidence opens the first span and evidence navigator;
- hovering/focusing status reveals its definition;
- proposed wording can be edited before applying;
- unsupported claim cannot masquerade as verified through a confidence percentage.

## Evidence component

Evidence appears as a plate with an indigo edge:

- source title and publisher;
- exact excerpt;
- locator: page, section, timestamp, or URL anchor;
- relationship: supports, contradicts, contextualizes;
- retrieval/publication dates;
- “Open source” action;
- integrity/snapshot metadata in expanded detail.

Quoted excerpts use serif or a subtle typographic shift, not oversized decorative quotation marks. Truncate carefully and offer expansion without losing the source locator.

## Source component

Source rows show:

- favicon/file-type icon;
- title and canonical domain/author;
- source class;
- publication and access dates;
- number of used evidence spans;
- processing/freshness state;
- warning if unavailable, duplicated, or superseded.

Primary/institutional/scholarly classification is metadata, not a blanket truth score.

## Relation component

Represent relation as readable language:

```text
[Amu Darya] — was diverted by → [Irrigation projects]
```

Include direction, predicate, epistemic status, and evidence availability. In a graph, edge selection opens the same canonical relation in the inspector.

## Status badges

Use compact rounded rectangles, not full pills by default.

Badge structure:

- optional glyph;
- explicit label;
- tinted background and matching accessible foreground;
- tooltip/help for unfamiliar epistemic terms.

Key badges:

- sourced fact;
- inference;
- hypothesis;
- user assertion;
- disputed;
- needs evidence;
- proposed;
- committed;
- stale/conflict.

## Tags and chips

Tags describe user-defined categorization. Chips represent selected scope, attached inputs, or removable filters.

- Tags may wrap in content areas.
- Scope chips must remain visible in the command composer.
- Removable chips include an accessible remove control.
- Avoid assigning every object multiple brightly colored tags.

## Tables

### Structure

- Sticky header and optional first column.
- 40 px comfortable / 32 px compact rows.
- Clear selected row state and checkbox semantics.
- Column resize handles visible on hover/focus.
- Horizontal scroll contained within canvas, with shadow/fade hint.
- Cell content truncates with tooltip/detail access; critical status does not disappear.

### AI operations

Proposed cells show a subtle tinted background and diff marker. Batch AI actions operate on explicit selection and display scope before submission.

### Empty/loading

Use skeleton rows only when the table structure is known. Otherwise show a compact progress state. Never animate shimmer indefinitely when a job is actually queued or failed.

## Graph

### Nodes

- Shape or inner glyph communicates object kind.
- Label stays readable at default zoom.
- Node size reflects importance only if the metric is explicit.
- Selection uses outline/halo; evidence status uses a small badge or ring segment.
- Proposed nodes have a dashed outer frame or vermilion corner mark.

### Edges

- Direction marker must remain visible.
- Predicate appears on selected/nearby edges and at sufficient zoom.
- Contradiction uses distinct line pattern plus label.
- Edge width does not imply confidence unless documented.

### Controls

- Zoom to fit;
- reset/local neighborhood;
- depth and object-kind filter;
- layout selector only when useful;
- list alternative;
- keyboard node traversal.

The graph starts with a selected node/local neighborhood. Never default to every object in a large workspace.

## Timeline

- Time axis uses mono numerals and low-contrast rules.
- Events group by period at low zoom and expand at high zoom.
- Date precision is explicit: exact date, month, year, range, approximate.
- Overlapping events stack without obscuring titles.
- Proposed events have the shared proposed-state treatment.
- Keyboard/list representation exposes chronological order.

## Proposal operation row

An operation row contains:

- accept checkbox or tri-state decision;
- operation type and object title;
- concise change summary;
- evidence coverage;
- warning/dependency count;
- edit and inspect actions.

Do not expose raw JSON to ordinary users. A developer/debug panel may show the normalized operation separately.

## Commit row

- version and commit title;
- actor;
- time;
- summary counts by operation type;
- originating request/proposal;
- view diff and revert actions.

AI-created origin is visible but not anthropomorphized. Example: “Proposed by research run · Applied by cxde.”

## Notifications and toasts

Toasts are for transient confirmation, not durable job status.

Use:

- “Changes applied · View commit”;
- “Link copied”;
- “Upload queued.”

Do not toast every background stage. Jobs live in the activity center. Errors with corrective action remain visible inline or in the drawer.

## Loading and progress

### Immediate operations

- Inline spinner only after approximately 150 ms to avoid flicker.
- Preserve control width.
- Disable duplicate submission while keeping cancel/navigation behavior clear.

### Research jobs

Use stage progress, source counts, elapsed time, and observable events. Avoid fake percentages unless the total work is known.

### Skeletons

Skeletons use subtle tonal pulse, not fast traveling shimmer. Stop animation under reduced motion.

## Tooltips

- Delay approximately 450–600 ms for pointer hover; immediate on keyboard focus after a short grace period.
- Never hide essential instructions exclusively in tooltips.
- Support rich definition popovers for epistemic terms, separate from simple action tooltips.
- Stay within viewport and do not cover the focused graph node or cited passage when avoidable.
