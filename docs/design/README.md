# Yomirai UI/UX design specification

This directory defines the visual and interaction design for Yomirai’s public website and research application. The direction is a contemporary Japanese-inspired dark aesthetic: quiet, precise, tactile, and editorial rather than decorative.

The design should feel like a private research atelier at night—dense with capability, but calm enough for extended analytical work.

## Design promise

> Complex knowledge, composed with clarity.

Yomirai should communicate four qualities within the first few seconds:

- **serious** — designed for research rather than casual conversation;
- **trustworthy** — provenance, state, and AI actions are always legible;
- **crafted** — typography, spacing, motion, and materials feel intentional;
- **calm** — the interface supports hours of work without visual fatigue.

## Documents

| Document | Purpose |
| --- | --- |
| [Creative direction](01-creative-direction.md) | Brand character, Japanese influence, visual language, and anti-patterns |
| [Design foundations](02-design-foundations.md) | Color, typography, spacing, surfaces, icons, grids, and tokens |
| [Application shell](03-application-shell.md) | Explorer, canvas, inspector, command surface, and navigation behavior |
| [Component system](04-component-system.md) | Reusable controls, knowledge objects, research states, and proposal UI |
| [Motion system](05-motion-system.md) | Animation principles, durations, easing, choreography, and reduced motion |
| [Screen specifications](06-screen-specifications.md) | Landing page, workspace, research flow, views, onboarding, and settings |
| [Responsive and accessible UX](07-responsive-accessibility.md) | Breakpoints, keyboard model, accessibility, localization, and QA |

## Product surfaces

The visual system covers two related but distinct experiences:

1. **Public website** — introduces the product with cinematic restraint, clear product proof, and a focused conversion path.
2. **Research application** — prioritizes information density, evidence, navigation, and long-session comfort.

They share typography, color, iconography, and motion language. The marketing site may use larger compositions and more atmospheric effects; the product UI must remain more restrained and utilitarian.

## Core visual model

```text
Atmosphere     Sumi darkness + warm paper light + restrained vermilion
Composition    Japanese editorial grid + intentional negative space
Material       Black lacquer depth + faint washi grain + fine metal-like rules
Typography     Neutral sans for work + Mincho-inspired serif for emphasis
Motion         Quiet, continuous, physical, never playful or elastic
Information    Canonical objects + visible evidence + reviewable AI changes
```

## Non-negotiable rules

1. The interface is dark by default, but never uses absolute black for large surfaces or pure white for long text.
2. Japanese references must be meaningful and restrained; decorative cultural symbols are not a substitute for design quality.
3. Vermilion is an action and identity accent, not a background color.
4. Gold is reserved for rare premium emphasis, never ordinary buttons or status.
5. Motion explains hierarchy, continuity, and state; it does not delay work.
6. Evidence, confidence, selection, and status never rely on color alone.
7. The canvas remains visually dominant. Chrome supports the work and recedes.
8. Every dense visual view has a list or document equivalent.

## Experience keywords

`composed` · `nocturnal` · `precise` · `tactile` · `editorial` · `quietly futuristic` · `scholarly` · `human`

Avoid: `cyberpunk` · `anime` · `gaming dashboard` · `corporate SaaS blue` · `glassmorphism everywhere` · `zen cliché` · `ornamental Japan`
