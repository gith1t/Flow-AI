# Design foundations

## Color system

The palette is inspired by sumi ink, black lacquer, warm paper, indigo dye, and vermilion annotation. Names guide designers; implementation uses semantic tokens.

### Neutral palette

| Token | Hex | Intended use |
| --- | --- | --- |
| `sumi-1000` | `#07090A` | Browser surround, cinematic marketing background |
| `sumi-950` | `#0A0C0E` | Application background |
| `sumi-900` | `#0E1113` | Canvas and primary shell surface |
| `sumi-850` | `#121619` | Elevated panels |
| `sumi-800` | `#171C20` | Hover/selected neutral surface |
| `sumi-700` | `#232A2F` | Strong divider and inactive control |
| `sumi-600` | `#343C42` | Focus-adjacent borders and disabled text |
| `ash-500` | `#6E777D` | Tertiary text |
| `ash-400` | `#929A9F` | Secondary text |
| `paper-200` | `#D8D5CC` | Muted light foreground |
| `paper-100` | `#ECE9E1` | Primary body text |
| `paper-50` | `#F6F2E9` | High-emphasis headings and light panels |

Avoid `#000000` and `#FFFFFF` for large areas. Warm paper foreground reduces glare and gives the product a crafted identity.

### Accent palette

| Semantic role | Default | Hover/strong | Soft background |
| --- | --- | --- | --- |
| Brand/action vermilion | `#D65342` | `#EC6654` | `#2A1514` |
| Evidence indigo | `#7189C2` | `#8EA4DA` | `#141A2A` |
| Verified moss | `#73A080` | `#8DB596` | `#14221A` |
| Warning amber | `#D2A45F` | `#E3B773` | `#291F12` |
| Conflict plum | `#A87AA0` | `#C08AB7` | `#241722` |
| Premium brass | `#BFA16A` | `#D2B87D` | `#251F15` |
| Destructive | `#CF5B61` | `#E36B72` | `#2A1518` |

Brass is not the primary CTA. Reserve it for plan status, rare highlights, or ceremonial milestones. Vermilion remains the recognizable interaction accent.

### Semantic color tokens

Use semantic names in components:

```text
--color-bg-app
--color-bg-canvas
--color-bg-panel
--color-bg-elevated
--color-bg-hover
--color-text-primary
--color-text-secondary
--color-text-tertiary
--color-border-subtle
--color-border-strong
--color-action-primary
--color-action-primary-hover
--color-focus-ring
--color-evidence
--color-success
--color-warning
--color-conflict
--color-danger
```

Color values may evolve after contrast testing; component code must not depend on palette names such as `sumi-850`.

### Contrast behavior

- Body text targets at least WCAG AA contrast.
- Secondary text may be lower emphasis but must still meet AA at its rendered size.
- Selected rows use surface, leading indicator, and icon/state changes—not only color.
- Status badges pair color with a label or symbol.
- Focus rings remain visible against every surface.

## Typography

### Typeface roles

| Role | Preferred family | Use |
| --- | --- | --- |
| Product UI | `Geist Sans`, `Noto Sans JP`, system sans-serif | Navigation, controls, tables, dense metadata |
| Editorial/display | `Noto Serif JP`, compatible Mincho serif | Marketing headlines, workspace covers, selected report headings |
| Data/technical | `IBM Plex Mono`, `Noto Sans Mono`, monospace | IDs, dates, queries, revisions, compact metrics |

Use Japanese-capable fallbacks from the start. Never rely on browser fallback to an unrelated CJK font after the Latin family.

### Type scale

| Style | Size / line height | Weight | Tracking | Use |
| --- | --- | --- | --- | --- |
| `display-xl` | `72 / 76` | 450 serif | `-0.035em` | Desktop landing hero only |
| `display-lg` | `56 / 62` | 450 serif | `-0.025em` | Marketing section statement |
| `heading-1` | `40 / 46` | 500 | `-0.025em` | Workspace cover/title |
| `heading-2` | `30 / 36` | 550 | `-0.018em` | Major canvas section |
| `heading-3` | `22 / 28` | 580 | `-0.012em` | Panel/inspector section |
| `title` | `17 / 23` | 600 | `-0.006em` | Object and card title |
| `body-lg` | `17 / 28` | 400 | `0` | Long-form report lead |
| `body` | `15 / 24` | 400 | `0` | Default body copy |
| `body-sm` | `13 / 20` | 430 | `0.005em` | Metadata and supporting text |
| `label` | `12 / 16` | 600 | `0.035em` | Compact controls and headings |
| `micro` | `11 / 15` | 550 | `0.06em` | Nonessential annotations |
| `code` | `12 / 18` | 450 mono | `0` | IDs, revisions, query fragments |

On small screens, scale display styles down responsively; body text must not fall below 14 px. Japanese body copy often benefits from slightly larger line height than equivalent Latin text.

### Typographic behavior

- Long research text uses a measure of 62–76 characters per line.
- Metadata and tabular numbers use tabular numeral features.
- Headings may use serif for editorial gravity; interactive labels remain sans.
- All-caps is limited to short Latin micro-labels. Do not transform Japanese text.
- Links in body text use color plus underline or another persistent affordance.
- Avoid ultra-light weights on dark backgrounds.

## Spacing system

Use a 4 px base unit with an intentional extended scale:

| Token | Value | Typical use |
| --- | --- | --- |
| `space-1` | 4 px | Icon/text micro-gap |
| `space-2` | 8 px | Compact control gap |
| `space-3` | 12 px | Row inner gap |
| `space-4` | 16 px | Default component padding |
| `space-5` | 20 px | Dense panel padding |
| `space-6` | 24 px | Standard panel padding |
| `space-8` | 32 px | Section grouping |
| `space-10` | 40 px | Large canvas section |
| `space-12` | 48 px | Page section interval |
| `space-16` | 64 px | Marketing subsection |
| `space-20` | 80 px | Large marketing rhythm |
| `space-24` | 96 px | Hero/major section interval |
| `space-32` | 128 px | Desktop cinematic separation |

Spacing should create clear intervals. Do not compensate for weak hierarchy by adding more borders.

## Grid and dimensions

### Marketing grid

- Maximum content width: 1440 px.
- Primary grid: 12 columns.
- Outer gutter: 72 px on wide desktop, 40 px on desktop, 24 px tablet, 18 px mobile.
- Column gap: 24 px desktop, 16 px tablet/mobile.
- Atmospheric elements may exceed the content grid but not create horizontal scroll.

### Application grid

- Top bar: 52 px.
- Explorer: 248 px default; 208–360 px resizable; 52 px collapsed rail.
- Inspector: 320 px default; 280–440 px resizable; dismissible.
- Command dock: 64 px collapsed; up to 42% viewport height as activity drawer.
- Canvas minimum usable width: 560 px on desktop.
- Main document content: 760–880 px readable column, with contextual objects allowed outside it.

Panel sizes persist per workspace and can be reset.

## Shape and radius

| Token | Value | Use |
| --- | --- | --- |
| `radius-xs` | 3 px | Tags, tiny indicators |
| `radius-sm` | 6 px | Inputs, compact rows |
| `radius-md` | 10 px | Cards, menus, panels |
| `radius-lg` | 16 px | Dialogs, command composer |
| `radius-xl` | 24 px | Marketing product frames only |
| `radius-full` | 999 px | Avatars, status dots, rare pills |

The product should not look soft or toy-like. Use modest radii and crisp edges for data surfaces.

## Borders, shadows, and depth

### Borders

- Default: 1 px at low contrast.
- Selected: 1 px stronger border plus 2 px inset/leading indicator.
- Hairline editorial rules may use 0.5–1 px where rendering remains crisp.
- Vermilion borders are reserved for focus, active proposal change, or destructive warning—not ordinary containers.

### Shadows

Use dark, broad, low-opacity shadows and a faint top edge:

```text
panel:   0 12px 36px rgba(0,0,0,.24), inset 0 1px rgba(255,255,255,.025)
dialog:  0 24px 80px rgba(0,0,0,.46), inset 0 1px rgba(255,255,255,.04)
hover:   0 8px 24px rgba(0,0,0,.18)
```

Do not use glowing shadows around every interactive element.

## Surface model

The shell uses five depth levels:

1. `ground` — browser/app background;
2. `canvas` — primary work surface;
3. `panel` — explorer and inspector;
4. `raised` — menus, popovers, selected cards;
5. `modal` — dialogs and command palette.

Depth is expressed through a combination of tone, edge highlight, occlusion, and motion. Blur is supplementary and should not reduce readability.

### Material recipes

**Sumi canvas**: near-black fill, subtle radial light from active content, no visible texture at normal zoom.

**Lacquer panel**: slightly warmer black, faint top-edge reflection, broad low shadow, optional 1% grain.

**Washi document**: dark warm-gray background in dark mode with paper-toned text; exported/light preview may use actual warm paper background. Never place dark body text on a noisy paper image.

**Evidence plate**: indigo-tinted background, fine indigo edge, source metadata in mono or compact sans.

## Iconography

- Use a coherent 1.5 px stroke icon set at 16, 18, 20, and 24 px.
- Corners are slightly squared; terminals are clean, not rounded-cartoonish.
- Filled icons are reserved for active state or high-severity status.
- Object kinds combine icon and text; do not require users to memorize symbols.
- Custom icons are needed for finding, evidence span, relation, change set, commit, and view types.

The product logo should not be reused as a generic loading indicator or decorative bullet.

## Data visualization palette

Graphs and charts use a muted categorical palette suitable for dark backgrounds:

```text
indigo   #7189C2
vermilion #D65342
moss     #73A080
amber    #D2A45F
plum     #A87AA0
cyan-gray #6E9DA0
paper    #C9C5BA
```

Rules:

- Use at most five simultaneous categorical colors before grouping or filtering.
- Relation types also use line style, label, or marker—not only color.
- Selected data receives contrast and halo/outline, not a different semantic color.
- Grid lines are subtle and reduced; labels remain readable.
- Provide table equivalents and textual summaries.

## Focus and selection

Keyboard focus uses a two-layer ring:

- inner 1 px dark separation;
- outer 2 px high-contrast indigo or paper-toned ring.

Selection uses:

- elevated/changed background;
- a 2 px leading or bottom indicator;
- visible selected icon/check state;
- optional soft vermilion accent for active AI changes.

Focus and selection must remain visually distinct when the selected element also has keyboard focus.
