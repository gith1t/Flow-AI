# Verification and release gates

## Purpose

Stage-level acceptance criteria prove each vertical result. This document defines the cumulative evidence required so a passing stage does not regress earlier behavior and the final MVP can be released with confidence.

## Definition of done for every stage

A stage is complete only when:

- its user/operator outcome is demonstrable from a clean environment;
- all direct prerequisite tests still pass;
- new public contracts are schema-validated and documented;
- new migrations apply from an empty database and upgrade the previous schema;
- authorization is tested at the API and repository/query boundary;
- success, empty, loading, failure, retry/conflict, and permission states relevant to the stage are handled;
- accessibility behavior for new UI is covered;
- logs/traces contain IDs and outcomes but no secrets/raw sensitive content by default;
- documentation and fixtures are updated;
- the verification artifact is attached to the handoff;
- working tree is clean and the stage can be reverted without manual repository repair.

## Test pyramid by layer

| Layer | Purpose | Runs |
| --- | --- | --- |
| Domain unit | Invariants, state transitions, inverse/validation rules | Every change |
| Application unit | Use cases through fake ports, authorization, zero-write guarantees | Every change |
| Contract | API/events/provider adapters/structured outputs | Every change |
| Database integration | Transactions, migrations, isolation, search/vector queries | Every change touching persistence |
| Worker integration | Leases, retries, cancellation, parser/workflow idempotency | Worker/research changes |
| Web component | Keyboard, focus, states, semantic rendering | UI changes |
| End-to-end | One complete vertical user outcome | Every stage |
| Accessibility | Automated scan plus task-specific keyboard/manual checks | Every UI stage |
| AI eval | Router/retrieval/extraction/synthesis quality | AI/prompt/model/tool changes |
| Security/adversarial | Isolation, injection, SSRF, uploads, malicious outputs | Relevant stage and release |
| Performance/load | Budgets, latency, large fixtures, worker/API capacity | Relevant stage and release |

## Stable regression journeys

Each completed journey remains in the permanent E2E suite.

| Journey | Introduced | Must prove |
| --- | --- | --- |
| Workspace access | `M02` | Sign in, create, reopen, archive; cross-user denial |
| Manual finding | `M03` | Operation → atomic commit → inspect/archive |
| Evidence | `M04` | Source → span → link → sourced fact → citation |
| Graph | `M05` | Relation → local graph/list → inspect/archive |
| Multiple views | `M06` | Same object/revision in document and table |
| Proposal | `M07` | Review/edit/reject/partial apply/conflict |
| Revert | `M08` | Commit detail → compensating commit |
| Scope | `M09` | Search/select/scope preview with isolation |
| AI answer | `M10` | Answer/reference with zero workspace writes |
| AI proposal | `M11` | Context → typed proposal → review → commit |
| Upload | `M12` | Safe file → parse → reader/locator → delete |
| Document citation | `M13` | Question → retrieval → citation → exact passage |
| Durable job | `M14` | Progress → reconnect → cancel/retry without duplicate |
| Document research | `M15` | Job → evidence proposal → partial apply |
| Web citation | `M16` | Explicit permission → search → clickable citations → zero write |
| Web research | `M17` | Bounded loop → proposal → apply → canonical follow-up |
| Landing conversion | `M18` | Product proof → auth/signup at all breakpoints |

## Test data strategy

### Deterministic domain fixtures

Maintain fixtures for at least:

- historical causal research;
- scientific paper comparison;
- travel plan with changed constraints;
- Japanese-language workspace and content;
- conflicting sources;
- stale proposal and concurrent edit;
- archived objects and missing sources;
- large workspace with hundreds/thousands of objects.

IDs, clocks, embeddings, provider outputs, and tool results are deterministic in tests.

### File corpus

Version small legally usable fixtures:

- normal searchable PDF with known page excerpts;
- scanned/empty PDF if OCR is not supported, expecting a clear limitation;
- corrupt and encrypted PDF;
- oversized/page-limit metadata fixture;
- plain text with headings and line locators;
- content containing prompt-injection attempts;
- duplicate-content files with different names.

Do not commit private user documents or production-derived content.

### Web corpus

Use a local/scripted web-search corpus for deterministic runs:

- multiple URLs supporting one claim;
- conflicting claims;
- duplicate/canonical URL variants;
- missing title/date/citation fields;
- blocked/private/unsafe URLs;
- prompt injection and misleading source text;
- tool timeout and partial result.

Live web/provider tests are opt-in canaries, not the only acceptance evidence.

## AI evaluation gates

### Router

- Mode and persistence classification by intent.
- False-persistence rate for unrelated questions.
- Scope/tool permission selection.
- Clarification when required.

### Retrieval

- Recall@k for known passages/objects.
- Irrelevant-context and cross-workspace result rate.
- Exact selection precedence.
- Citation locator resolution.

### Extraction and synthesis

- Evidence-span precision and locator correctness.
- Claim/evidence entailment.
- Epistemic-status correctness.
- Conflict/contradiction preservation.
- Unsupported-claim and invented-ID rate.

### Operations

- Schema and invariant validity.
- Correct create versus update behavior.
- Minimality and no forbidden operation.
- Temporary references/dependencies.
- Model cannot bypass proposal review.

### End-to-end

- Task coverage and usefulness on multiple domains.
- Source diversity/quality and transparent gaps.
- Cost, latency, call count, and stop-condition adherence.
- Human acceptance/edit/reject/revert signals once beta data is available.

Numerical thresholds must be approved before `M10`, `M13`, `M15`, and `M17` are promoted beyond development. Store the threshold and model/prompt snapshot with the report; do not use a floating “looks good” gate.

## Security gates by boundary

| Boundary | Required evidence |
| --- | --- |
| Workspace/API | Cross-user/workspace denial for all resource classes and not-found non-disclosure |
| Operations | Authorization, revision, idempotency, atomicity, forbidden mutation tests |
| Search/retrieval | Workspace/document filters applied before ranking/model context |
| Upload/parser | Signature/size/time/page limits, quarantine, sandbox, safe rendering |
| Web access | URL scheme/host/IP/redirect/size/time policy; no private network access |
| Prompt/model | Trusted/untrusted separation, injection corpus, no mutating tools |
| Jobs/SSE | Event authorization, sequence, reconnect, cancellation, lease recovery |
| Logs/traces | Secret/content redaction and access policy |
| Data lifecycle | Export/delete across DB, object store, index, provider resources, backups policy |

## Accessibility gates

For each critical flow at mobile and desktop:

- automated WCAG scan has no serious/critical violations;
- keyboard-only completion is documented and tested;
- focus order/return is correct after dialog, sheet, route, proposal apply, and async update;
- landmarks/headings/names/states are semantically correct;
- 200% zoom and 320 CSS px reflow preserve primary functionality;
- reduced motion removes ambient/spatial animation while preserving state feedback;
- status/evidence/proposal states do not rely on color alone;
- English and Japanese fixtures do not clip or lose meaning;
- graph has complete list alternative;
- progress announcements are useful and not noisy.

## Performance and reliability budgets

Product owners must set final numbers, but every stage reports:

- cold/warm web route load and interaction responsiveness;
- API p50/p95 latency for its endpoints;
- database query count/time on realistic fixtures;
- background stage duration and queue age where applicable;
- model input/output tokens, tool calls, estimated cost, and cache usage;
- client bundle impact for heavy features such as graph/editor;
- reconnect/retry behavior under injected failure.

Hard ceilings are configured for:

- upload bytes/pages/parser time;
- search results/context tokens;
- AI calls/input/output/tool calls/spend;
- job wall time/retries/concurrency;
- SSE retention/replay window;
- table/graph default result size.

## Handoff template for one agent

Every implementation agent should return:

```text
Stage:
Prerequisite commits:
Outcome demonstrated:
Modules changed:
Public contracts added/changed:
Migrations:
Configuration/secrets:
Tests and evals run:
Verification artifact:
Accessibility checks:
Security considerations:
Known limitations within acceptance criteria:
Follow-up tasks (not required for this stage):
Final commit(s):
```

A follow-up task cannot be used to excuse a failed acceptance criterion. If required behavior is incomplete, the stage remains incomplete.

## Beta release gate

`M22` may pass only when all statements are true:

1. All direct prerequisites in the dependency graph are merged and green.
2. Permanent E2E journeys pass from a clean beta-like environment.
3. No model output or worker path can mutate canonical workspace state outside the validated application commit transaction.
4. Every externally verifiable applied finding has supporting evidence or a non-fact epistemic status.
5. Users can inspect sources/evidence, partial-apply proposals, and revert commits.
6. Document, table, graph, and accessible graph-list views use canonical objects.
7. Document and web research respect scope, budgets, cancellation, and retry/idempotency.
8. Cross-workspace isolation and prompt-injection/SSRF/upload suites pass.
9. Data export/deletion and backup/restore have reproducible reports.
10. Critical flows pass accessibility and responsive gates.
11. Model/prompt/tool snapshots meet approved eval, cost, and latency thresholds.
12. Deployment/migration/rollback/incident runbooks have been exercised.
13. Public website claims only capabilities present in the beta build.
14. Known risks are documented with owner, severity, mitigation, and review date.

The beta readiness report links each statement to its test, evaluation, trace, or drill output.
