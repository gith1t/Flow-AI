# ADR 0003: AI proposes; the application commits

- Status: Accepted
- Date: 2026-07-15

## Context

Model output can be malformed, stale, unauthorized, duplicated, unsupported by evidence, or influenced by prompt injection. Direct model writes would make workspace truth difficult to trust and audit.

## Decision

Models can emit only typed proposal operations. The application validates schema, authorization, references, revisions, provenance, dependencies, and domain invariants. The user reviews operations by default. Accepted operations are revalidated and applied in one application-controlled database transaction that creates a commit.

## Consequences

### Positive

- AI errors are contained before persistence.
- Users can inspect and partially accept work.
- Every change is attributable and reversible.
- The same operation path serves manual and AI changes.
- Acceptance/edit/rejection data becomes an evaluation signal.

### Negative

- Adds review friction and UI complexity.
- Requires operation diff, dependency, and conflict logic.
- Some apparently simple edits take an extra click.

## Future automation

Auto-apply may be introduced per operation type, user policy, and measured reliability. It does not remove validation or commit creation. High-risk operations remain review-only.

## Rejected alternatives

- Let the model call database mutation tools: too much authority and weak review semantics.
- Have the model return a complete replacement workspace JSON document: expensive, conflict-prone, and difficult to diff safely.
- Persist all assistant responses and extract later: recreates chat clutter and loses intentional object semantics.
