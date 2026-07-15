# Responsive and accessible UX

## Responsive strategy

Yomirai is desktop-first for complex visual research, but reading, asking, reviewing, and applying must work on tablets and phones. Responsive design changes the composition; it does not simply shrink all four desktop panels.

## Breakpoints

Use content-driven breakpoints near:

| Name | Range | Typical composition |
| --- | --- | --- |
| `mobile` | `< 640 px` | Single primary surface + bottom command/navigation |
| `tablet` | `640–1023 px` | Canvas + one overlay panel |
| `desktop` | `1024–1439 px` | Explorer + canvas, inspector overlay/conditional |
| `wide` | `≥ 1440 px` | Explorer + canvas + inspector simultaneously |

These values are starting points. Components should respond to available container width where possible.

## Desktop and wide screens

- Wide: all primary regions may remain visible.
- Standard desktop: preserve explorer and canvas; inspector may overlay or replace a portion based on canvas minimum width.
- Resizable panels have keyboard-accessible handles and reset actions.
- Very wide monitors do not stretch long-form text; use the extra area for context, graph, or evidence.

## Tablet

- Explorer becomes a slide-over or compact rail.
- Inspector becomes a right sheet or full-height overlay.
- Command dock spans safe canvas width.
- Proposal review switches between change navigator and preview with persistent decision summary.
- Table and graph retain full canvas width; controls consolidate into a filter/display sheet.

Landscape tablet should support canvas plus one docked panel if width allows.

## Mobile

### Navigation

- Top bar: back/context title, activity, overflow.
- Optional bottom navigation: Overview, Views, Sources, Activity.
- Explorer becomes a full-height navigation sheet.
- Object inspector becomes a detail page or bottom sheet depending content depth.

### Command composer

- Fixed above safe-area inset.
- Single-line resting state; expands full-width upward.
- Scope appears as a compact persistent line/chip.
- Attachment and settings actions move into a clearly labeled menu.
- Keyboard does not hide submit, scope, or cancellation controls.

### Views

- Document: primary mobile experience.
- Table: card/row adaptation with horizontal scroll only for true comparison needs.
- Graph: simplified local neighborhood with explicit list switch; no expectation of complex editing.
- Timeline: vertical chronological layout.
- Proposal: one operation at a time with swipe-free explicit accept/reject/edit controls and a progress summary.

### Touch

- Minimum target: 44 × 44 CSS px where possible.
- No hover-only actions.
- Long press is optional enhancement, never the only path.
- Dragging has button/menu alternatives.
- Edge gestures must not conflict with browser/OS navigation.

## Marketing responsiveness

- Hero display size reduces to approximately 38–46 px on mobile.
- Product demo becomes a focused single interaction rather than a tiny full desktop screenshot.
- Asymmetric compositions stack in a deliberate reading order.
- Vertical decorative labels are removed or made horizontal.
- Sticky scroll sequences become ordinary sections under reduced motion or limited viewport height.
- CTA remains visible without waiting for animations.

## Accessibility target

Target WCAG 2.2 AA for the product and marketing website. Treat this as a design and engineering release criterion, not a post-launch audit.

## Semantic structure

- Use landmarks: header, nav, main, aside, footer.
- Maintain one logical page heading and hierarchical section headings.
- Use real buttons, links, inputs, tables, lists, and dialogs.
- Graph canvas includes an equivalent semantic list/tree representation.
- View switching announces the new view and preserves logical focus.
- Status and progress use live regions with restrained announcement frequency.

## Keyboard model

### Global

| Key | Behavior |
| --- | --- |
| `Cmd/Ctrl + K` | Open search/workspace palette |
| `Cmd/Ctrl + Enter` | Submit command when composer is focused |
| `Escape` | Close latest transient layer or clear selection in defined order |
| `?` | Open keyboard shortcut reference when not typing |

### Lists and trees

- Arrow keys navigate within focused composite widgets.
- Enter/Space activates or selects according to platform conventions.
- Shift extends multi-selection where supported.
- Home/End moves to boundaries.
- Typeahead locates visible items.

### Proposal review

- Change list supports arrow navigation.
- Clearly documented shortcuts may accept/reject, but ordinary buttons remain available.
- Focus moves to relevant preview heading when explicitly requested, not on every selection.
- Apply returns focus to the resulting canvas/commit confirmation.

### Graph

- Tab enters graph controls or the graph widget once, not every node.
- Arrow keys navigate spatially or through a deterministic neighbor list.
- Enter opens/inspects node.
- A list representation provides complete equivalent access.

## Focus management

- Opening modal/sheet traps focus and returns it to the trigger.
- Opening inspector from a selected object may move focus only when the user invokes “Open details”; simple selection should not steal focus.
- Route changes focus the page/view heading or a suitable main landmark.
- Job progress updates never steal focus.
- Validation errors focus the summary or first invalid field with clear links.
- Virtualized tables preserve a logical active row and announce row/column context.

## Screen reader behavior

- Icon-only buttons have accessible names.
- Badges expose label and status meaning.
- Evidence links announce source title and locator.
- Proposed changes identify operation type and decision state.
- Diff markup uses inserted/deleted semantics where appropriate and provides a concise summary.
- Graph node descriptions include kind, label, relation count, evidence state, and selection.
- Progress announces stage transitions, not every token/source arrival.

## Color and contrast

- Validate actual rendered tokens against every surface.
- Text, icons, borders required for understanding, and focus indicators meet their relevant contrast targets.
- Evidence/support/conflict states combine label, icon/line style, and color.
- High-contrast/forced-color modes preserve controls and selection.
- Texture and ambient gradients disappear when they reduce contrast.

## Motion and vestibular safety

- Honor reduced motion at first render to prevent an initial unwanted animation.
- Avoid large zooms, rotation, rapid parallax, and continuous graph movement.
- Provide static alternatives for scroll-driven product demos.
- Do not tie essential reading progression to animation completion.
- See [Motion system](05-motion-system.md) for replacement behavior.

## Typography and zoom

- Support browser zoom to at least 200% without loss of function.
- Reflow at 320 CSS px for primary reading and command flows.
- Avoid fixed-height text containers.
- Japanese and Latin glyphs align with suitable fallbacks and sufficient line height.
- Do not use micro type for required status, source, or error information.

## Localization

The UI must support English and Japanese without treating either as decorative.

- All strings are externalized.
- Layout accommodates longer English labels and compact Japanese labels.
- Do not force uppercase transformations.
- Date, time, number, quotation, and list formatting use locale-aware APIs.
- Japanese line breaking avoids inappropriate starts/ends where browser support allows.
- Search/tokenization behavior is tested with Japanese content.
- Vertical writing is optional marketing decoration only and is reviewed by a fluent speaker.
- Product terminology receives an approved glossary to prevent inconsistent translations.

Suggested language behavior:

- Default to browser/user preference at onboarding.
- Workspace content language is independent from application language.
- The command composer shows which language the assistant is expected to answer in when it differs from the UI.

## Cognitive accessibility

- Use stable labels and region positions.
- Avoid hidden mode changes; show whether a request will answer, propose, or research.
- Explain epistemic states in plain language.
- Break proposal review into meaningful groups.
- Preserve user decisions and input across errors.
- Allow users to pause/minimize research activity.
- Use direct errors with one primary recovery action.
- Do not overload screens with decorative Japanese terminology.

## Content safety and trust UX

- Distinguish AI proposal from committed workspace data visually and semantically.
- Make source origin and external-link behavior clear.
- Never use animation or color to imply verification that does not exist.
- Show when evidence is indirect, disputed, stale, or unavailable.
- Destructive/archive confirmation names affected objects and dependent views.
- Privacy/source policy is visible before starting research, not buried only in settings.

## Performance accessibility

Slow interfaces create accessibility barriers.

- Render the shell and existing workspace independently from AI provider availability.
- Virtualize large tables/lists while preserving keyboard and screen-reader semantics.
- Load graph and rich editors only when needed.
- Reserve layout space to avoid cumulative layout shift.
- Optimize font loading and provide metrically compatible fallbacks.
- Prefer SVG/CSS for simple material effects; constrain noise and video assets.
- Core commands remain responsive during background research.

## UX QA checklist

Every major screen should be tested for:

- keyboard-only completion;
- screen reader landmarks, names, states, and progress;
- 200% zoom and narrow reflow;
- reduced motion;
- high contrast/forced colors;
- English and Japanese content;
- long workspace/object/source titles;
- empty, loading, partial, error, stale, and offline states;
- dense fixtures with hundreds of objects and sources;
- touch interaction where supported;
- focus preservation after async updates.

## Design handoff requirements

For each component/screen, design files should include:

- responsive frames and constraints;
- complete interaction states;
- token references rather than raw values;
- keyboard/focus annotations;
- motion timing/easing or reduced-motion alternative;
- realistic dense and long-text fixtures;
- English and Japanese examples;
- empty/loading/error/conflict/proposed states;
- accessible name/role/description where non-obvious.

Implementation is not accepted based only on visual similarity. Interaction semantics, proposal boundaries, evidence clarity, motion preferences, and keyboard behavior are part of the design.
