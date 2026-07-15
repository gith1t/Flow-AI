# Motion system

## Motion character

Yomirai motion is calm, continuous, and spatially coherent. It should feel like arranging paper, sliding a panel, or bringing an annotation into focus—never like a game interface.

Motion serves four purposes:

1. explain where an element came from or went;
2. preserve context between views;
3. confirm user action and system state;
4. focus attention on meaningful change.

If animation does not improve one of these, remove it.

## Timing tokens

| Token | Duration | Use |
| --- | --- | --- |
| `motion-instant` | 80 ms | Press, focus color, tiny icon state |
| `motion-fast` | 140 ms | Hover surface, tooltip fade, checkbox |
| `motion-base` | 220 ms | Menu, popover, row insertion, tab indicator |
| `motion-panel` | 280 ms | Inspector/explorer/drawer transition |
| `motion-view` | 360 ms | View switch, proposal preview transition |
| `motion-hero` | 600 ms | Marketing hero/brand reveal |
| `motion-ambient` | 8–20 s | Very subtle marketing-only background drift |

Avoid stacking delays that make an interaction exceed roughly 400 ms before it becomes usable. Content may continue settling after interaction if the target is already operable.

## Easing tokens

```text
--ease-standard: cubic-bezier(.2, .0, .0, 1)
--ease-enter:    cubic-bezier(.16, 1, .3, 1)
--ease-exit:     cubic-bezier(.4, 0, 1, 1)
--ease-emphasis: cubic-bezier(.2, .8, .2, 1)
```

- Standard: movement between stable states.
- Enter: content decelerates gently into place.
- Exit: content leaves quickly to make space.
- Emphasis: one-time marketing or applied-change reveal.

Springs may be used for drag/reorder and graph settling, with high damping and minimal overshoot. Ordinary buttons, panels, and dialogs do not bounce.

## Spatial rules

- Panels enter from the edge they occupy.
- Inspector content does not fade in from an unrelated direction.
- Object detail opened from a graph node uses a subtle shared-origin highlight or connecting movement.
- Command activity expands upward from the command dock.
- New proposed objects appear near their logical group, not from viewport center.
- Back navigation reverses the previous spatial transition where practical.

Use translation of 4–16 px for most UI transitions. Larger 24–48 px movement belongs to marketing or full-screen navigation.

## Opacity and blur

- Pair opacity with small position/scale changes; pure crossfades are acceptable for content that occupies the same semantic location.
- Blur may transition from 4–8 px to zero for marketing reveals and modal backdrops.
- Do not animate heavy backdrop blur over large dense canvases.
- Never blur body text during scrolling or selection.

## Core interaction motions

### Button

- Hover: background/edge shift over 140 ms.
- Press: translate down 1 px or scale to 0.985 over 80 ms.
- Release: return over 140 ms.
- Loading: label remains or transitions to a status phrase; spinner rotates at a calm constant rate.

No elastic rebound.

### Menu/popover

- Enter: opacity 0 → 1, scale 0.98 → 1, translate 4 px → 0 over 180–220 ms.
- Transform origin matches trigger position.
- Exit: 120–150 ms.
- Focus is placed after the surface exists, without waiting for the full visual transition.

### Dialog

- Backdrop fades over 180 ms.
- Surface enters with opacity plus 8 px translation and 0.985 scale over 240 ms.
- Exit is 160–180 ms.
- When reduced motion is active, use opacity only or instant state change.

### Explorer and inspector

- Width transitions over 260–300 ms with standard easing.
- Canvas uses the same layout transition rather than jumping after the panel finishes.
- Inner content fades only if reflow would be visually noisy.
- During resize drag, animation is disabled and layout follows the pointer directly.

### Command dock and activity drawer

- Composer focus adds a fine vermilion edge and increases elevation over 180 ms.
- Expanded composer grows upward over 260 ms; text cursor position remains stable.
- Research submission transforms the run control into a progress/state control without moving to another corner.
- Activity stages crossfade/slide vertically by 4 px; do not animate every log line dramatically.
- Completion creates one restrained vermilion sweep/edge pulse, then settles to neutral.

### Tabs and view switching

- Tab indicator slides to the new tab over 180–220 ms.
- Compatible view switches preserve selected objects and morph/reposition where feasible.
- Document ↔ table may use a 220 ms crossfade with shared selection highlight.
- Table ↔ graph uses a 320–360 ms transition: rows fade/contract while selected nodes emerge. Avoid attempting a complex one-to-one morph for hundreds of objects.
- View controls become usable immediately after the new view mounts.

## Research progress

Research is long-running, so its animation must communicate life without implying fake precision.

### Stage indicator

- Current stage has a subtle traveling edge or breathing opacity between 0.72 and 1.
- Completed stages resolve into a static check/mark.
- Future stages remain visible but quiet.
- The animation cycle is 1.6–2.4 seconds, not frantic.

### Source ingestion

New sources may enter as compact rows with a 4 px upward slide and fade. Batch multiple arrivals within 300–500 ms to avoid a stream of distracting animations.

### Unknown progress

Use an indeterminate line with slow directional movement, accompanied by explicit stage copy. Do not use a percentage.

### Known progress

When parsing 8 of 12 files, update the bar width with a 220 ms transition and show numeric text.

## Proposal motion

Proposal review is the signature interaction.

### Enter review

1. Activity summary contracts into a proposal header.
2. Canvas shifts into split review layout over 320–360 ms.
3. Change groups appear in short staggered sequence: 30–45 ms between groups, maximum total stagger 180 ms.
4. First relevant operation receives focus; no automatic scroll after the user begins interacting.

### Inspect operation

- Selecting an operation highlights its affected canonical object.
- Current/proposed content uses a directional wipe or 8 px cross-slide, not flashing color.
- Evidence plate enters from the inspector side and preserves the diff.

### Accept/reject

- Decision control changes instantly, with a 140 ms color/glyph transition.
- Rejected item remains visible but muted unless the user filters it out.
- Dependent-operation warnings update with a short 180 ms emphasis.

### Apply

1. Button confirms count and enters progress state.
2. Accepted proposed markers transition from vermilion to neutral over 360 ms.
3. New objects settle into the active view.
4. A small commit confirmation appears with a link to history.

Do not use confetti, fireworks, or a large celebratory modal. The visual reward is the workspace becoming composed.

## Graph motion

- Initial layout settles within approximately 700–1000 ms.
- After settling, nodes stop moving unless the user interacts or data changes.
- Expanding a neighborhood grows nodes from the selected node’s vicinity.
- Removing/filtering nodes fades and contracts them before local relayout.
- Dragging is direct; release uses a critically damped settle.
- Hover can strengthen connected edges over 120 ms.
- Large graph updates batch to one layout transition.

Provide “Pause layout” and reduced-motion behavior. Continuous floating nodes are prohibited.

## Marketing motion

The public website may be more atmospheric, within strict limits.

### Hero sequence

Suggested 800–1200 ms total choreography:

1. wordmark/symbol aligns and reveals a narrow vermilion seam;
2. headline enters by line with 40–60 ms offset;
3. product frame resolves from dark tonal layers;
4. one graph/research transition demonstrates structure emerging from a prompt.

The CTA is visible and interactive without waiting for the sequence.

### Scroll reveals

- Sections reveal once using 12–24 px vertical motion and opacity.
- Product demo may use sticky progression when it remains keyboard and reduced-motion accessible.
- Avoid parallax tied to large text blocks.
- Ambient grain/light moves extremely slowly or remains static.

## Reduced motion

Respect `prefers-reduced-motion: reduce` and expose an application preference if needed.

Under reduced motion:

- remove ambient drift and parallax;
- replace spatial transitions with short opacity changes or instant updates;
- disable graph force animation and use deterministic static layout;
- remove skeleton shimmer and breathing effects;
- keep progress understandable through text and static indicators;
- preserve focus movement and semantic state announcements.

Reduced motion is not “no feedback.” State changes still require clear visual and assistive-technology confirmation.

## Performance budgets

- Animate transform and opacity where possible.
- Avoid layout animation across thousands of table rows; use virtualization and local indicators.
- Limit simultaneous animated graph elements.
- Marketing ambient effects must not block input or degrade scrolling.
- Target consistent 60 fps on supported desktop hardware and 30–60 fps on mid-range mobile.
- Interaction feedback should begin within 100 ms even if work continues.
- Pause offscreen and background-tab animations.

Profile motion on actual dense research fixtures, not empty demo screens.
