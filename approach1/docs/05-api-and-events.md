# API and events

## API principles

- The public API speaks in domain resources and commands, not database rows or provider response objects.
- Reads are resource-oriented; complex mutations are explicit commands.
- Every mutation requires an idempotency key and returns the authoritative workspace version.
- Every workspace-scoped route authorizes membership before resolving object IDs.
- Long work returns `202 Accepted` with a job resource.
- Optimistic concurrency uses workspace version and object revision.
- Errors are typed and machine-readable.

The exact URL and field naming can evolve during implementation; the important contract is the separation among requests, jobs, proposals, and committed state.

## Resource map

### Workspaces

- `POST /v1/workspaces` — create workspace
- `GET /v1/workspaces` — list accessible workspaces
- `GET /v1/workspaces/{workspaceId}` — workspace summary and version
- `PATCH /v1/workspaces/{workspaceId}` — update metadata/policy
- `POST /v1/workspaces/{workspaceId}:archive` — archive workspace

### Objects and relations

- `GET /v1/workspaces/{workspaceId}/objects` — filter/search/paginate
- `POST /v1/workspaces/{workspaceId}/objects` — manual object creation through normal commit path
- `GET /v1/workspaces/{workspaceId}/objects/{objectId}` — detail with evidence/relations
- `PATCH /v1/workspaces/{workspaceId}/objects/{objectId}` — manual update with revision
- `POST /v1/workspaces/{workspaceId}/objects/{objectId}:archive`
- `GET /v1/workspaces/{workspaceId}/relations`
- `POST /v1/workspaces/{workspaceId}/relations`

Manual mutations internally become operations and commits, preserving one audit model for human and AI changes.

### Views

- `GET /v1/workspaces/{workspaceId}/views`
- `POST /v1/workspaces/{workspaceId}/views`
- `GET /v1/workspaces/{workspaceId}/views/{viewId}`
- `PATCH /v1/workspaces/{workspaceId}/views/{viewId}`
- `GET /v1/workspaces/{workspaceId}/views/{viewId}/results` — materialized view result at a version

### Sources and documents

- `POST /v1/workspaces/{workspaceId}/uploads` — start upload and receive signed URL
- `POST /v1/workspaces/{workspaceId}/uploads/{uploadId}:complete`
- `GET /v1/workspaces/{workspaceId}/documents/{documentId}`
- `GET /v1/workspaces/{workspaceId}/sources`
- `GET /v1/workspaces/{workspaceId}/sources/{sourceId}`
- `GET /v1/workspaces/{workspaceId}/sources/{sourceId}/evidence`

### Assistant requests and jobs

- `POST /v1/workspaces/{workspaceId}/assistant-requests` — submit question/command
- `GET /v1/workspaces/{workspaceId}/assistant-requests/{requestId}`
- `GET /v1/workspaces/{workspaceId}/jobs/{jobId}`
- `POST /v1/workspaces/{workspaceId}/jobs/{jobId}:cancel`
- `POST /v1/workspaces/{workspaceId}/jobs/{jobId}:retry`
- `GET /v1/workspaces/{workspaceId}/events` — SSE stream

### Change sets and commits

- `GET /v1/workspaces/{workspaceId}/changesets/{changesetId}`
- `POST /v1/workspaces/{workspaceId}/changesets/{changesetId}:validate`
- `POST /v1/workspaces/{workspaceId}/changesets/{changesetId}:apply`
- `POST /v1/workspaces/{workspaceId}/changesets/{changesetId}:discard`
- `GET /v1/workspaces/{workspaceId}/commits`
- `GET /v1/workspaces/{workspaceId}/commits/{commitId}`
- `POST /v1/workspaces/{workspaceId}/commits/{commitId}:revert`

## Submit assistant request

Request example:

```json
{
  "input": "Compare the selected explanations and create a causal graph.",
  "scope": {
    "type": "selection",
    "object_ids": ["obj_1", "obj_2", "obj_3"],
    "allow_web": false
  },
  "desired_mode": "auto",
  "expected_workspace_version": 42,
  "client_request_id": "client_01..."
}
```

Immediate answer response:

```json
{
  "request_id": "req_1",
  "mode": "answer",
  "answer": {
    "markdown": "...",
    "references": [{"object_id": "obj_1"}]
  },
  "persistence": "none",
  "workspace_version": 42
}
```

Direct proposal response:

```json
{
  "request_id": "req_2",
  "mode": "proposal",
  "changeset_id": "chg_1",
  "status": "ready",
  "base_workspace_version": 42
}
```

Research response:

```json
{
  "request_id": "req_3",
  "mode": "research_job",
  "job_id": "job_1",
  "status": "queued",
  "events_url": "/v1/workspaces/ws_1/events?job_id=job_1"
}
```

## Change-set representation

```json
{
  "id": "chg_1",
  "workspace_id": "ws_1",
  "base_workspace_version": 42,
  "status": "ready",
  "summary": "Adds a causal graph and two unresolved questions.",
  "warnings": [],
  "operations": [
    {
      "id": "op_1",
      "type": "object.create",
      "temporary_id": "tmp_question_1",
      "payload": {
        "kind": "question",
        "title": "Which explanation best fits evidence after 1990?",
        "epistemic_status": "unknown"
      },
      "depends_on": [],
      "risk": "low",
      "validation": {"status": "valid"}
    },
    {
      "id": "op_2",
      "type": "view.create",
      "payload": {
        "type": "graph",
        "title": "Competing causal explanations",
        "query": {"seed_ids": ["obj_1", "obj_2", "obj_3"], "max_depth": 1}
      },
      "depends_on": [],
      "risk": "low",
      "validation": {"status": "valid"}
    }
  ]
}
```

## Apply change set

Request:

```json
{
  "expected_workspace_version": 42,
  "decisions": [
    {"operation_id": "op_1", "decision": "accept"},
    {
      "operation_id": "op_2",
      "decision": "accept_with_edit",
      "payload_patch": {"title": "Causal explanations"}
    }
  ]
}
```

The server must:

1. re-authorize every selected operation;
2. verify base workspace and target revisions;
3. apply allowed user edits and revalidate;
4. remove rejected operations and any now-unsatisfied dependants;
5. run all accepted operations in one database transaction;
6. insert commit, audit record, and outbox events;
7. return the new version and affected resources.

If the workspace version has advanced, return `409 workspace_version_conflict` with changed targets and a rebase option. Never silently apply stale semantic updates.

## Error envelope

```json
{
  "error": {
    "code": "workspace_version_conflict",
    "message": "The workspace changed after this proposal was created.",
    "request_id": "api_req_...",
    "retryable": false,
    "details": {"expected": 42, "actual": 44}
  }
}
```

Important codes include:

- `unauthorized`, `forbidden`, `not_found`;
- `validation_failed`, `unsupported_operation`;
- `workspace_version_conflict`, `object_revision_conflict`;
- `budget_exceeded`, `rate_limited`;
- `provider_unavailable`, `tool_failed`;
- `job_cancelled`, `job_not_retryable`;
- `unsafe_content`, `source_access_denied`.

## SSE events

Events contain `id`, `type`, `workspace_id`, `sequence`, `occurred_at`, and typed `data`. Clients reconnect with `Last-Event-ID`.

MVP event types:

- `job.queued`
- `job.stage_started`
- `job.progress`
- `job.warning`
- `job.stage_completed`
- `job.failed`
- `job.cancelled`
- `changeset.ready`
- `changeset.updated`
- `commit.created`
- `workspace.version_changed`

Progress events report observable actions such as source counts and stage names, never private chain-of-thought.

```json
{
  "id": "evt_101",
  "type": "job.progress",
  "workspace_id": "ws_1",
  "sequence": 7,
  "occurred_at": "2026-07-15T12:00:00Z",
  "data": {
    "job_id": "job_1",
    "stage": "gathering",
    "message": "Reading selected sources",
    "completed": 8,
    "total": 12
  }
}
```

## Internal domain events

Internal events are written to an outbox in the same transaction as state changes:

- `WorkspaceCreated`
- `ObjectCreated`, `ObjectUpdated`, `ObjectArchived`
- `RelationCreated`, `RelationArchived`
- `EvidenceAttached`, `EvidenceDetached`
- `ViewCreated`, `ViewUpdated`
- `ChangeSetCreated`, `ChangeSetValidated`, `ChangeSetApplied`
- `CommitCreated`
- `DocumentIngested`, `DocumentIndexFailed`

Consumers must be idempotent. Events include aggregate ID, aggregate revision, commit ID, actor, trace ID, and schema version.

## Contract versioning

- URL major version protects external clients.
- Every event and stored operation has its own schema version.
- Additive fields are backward compatible.
- Operation migrations preserve the original payload and produce a normalized current representation for replay/display.
- Provider tool schemas are internal and versioned separately from the Yomirai API.
