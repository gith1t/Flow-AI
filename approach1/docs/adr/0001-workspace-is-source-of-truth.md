# ADR 0001: Workspace is the source of truth

- Status: Accepted
- Date: 2026-07-15

## Context

The product begins from the failure mode of long AI conversations: knowledge exists only as chronological messages. Provider conversation state can preserve continuity, but it is not a suitable domain database for structured views, provenance, permissions, versioning, or provider-independent retention.

## Decision

Canonical user knowledge is stored in Yomirai workspaces as typed objects, relations, sources, evidence, and views. Messages and model/provider response IDs are execution and interaction metadata.

Every new AI request receives a task-specific context bundle built from canonical workspace state. Provider continuation may be used within bounded executions, but no durable feature depends on replaying the whole message transcript.

## Consequences

### Positive

- Long-running research remains navigable and editable.
- Multiple views share one dataset.
- Retrieval is scoped, testable, and provider-independent.
- Data lifecycle, export, authorization, and version history are under application control.

### Negative

- The application must build retrieval and context assembly.
- Conversational continuity needs explicit recent-turn handling.
- Domain migrations and indexing become product responsibilities.

## Rejected alternatives

- Store only chat messages and generate structure on demand: inconsistent, slow, and hard to version.
- Use an OpenAI conversation/thread as the primary database: couples product semantics and retention to provider state.
- Serialize the entire workspace into each prompt: does not scale in cost, relevance, or reliability.
