# MVP vertical stages

## How to use this catalog

Stages are listed in logical order, but the numeric order is not a requirement to execute all tasks serially. Use the dependency graph in [Dependencies and parallelism](02-dependencies-and-parallelism.md) to identify safe concurrency.

For every stage, the assigned agent owns implementation, tests, affected documentation, and a clean handoff. Work outside the listed modules requires an explicit reason in the handoff.

## M00 — Executable monorepo and runtime spine

### Outcome

A developer can clone the repository, install dependencies, start the web/API/worker plus local PostgreSQL and object storage, open a premium dark placeholder shell, call API health/readiness endpoints, and run CI-equivalent checks locally.

### Scope

- Create pnpm/Turborepo workspace and root scripts.
- Scaffold `apps/web`, `apps/api`, and `apps/worker` as composition roots.
- Create only the shared packages needed to prove dependency direction: contracts, config, observability, domain, application, database, UI, and testkit.
- Add typed configuration validation and example environment file.
- Add local PostgreSQL with pgvector and S3-compatible storage configuration.
- Add first migration mechanism and empty schema baseline.
- Add structured logging with trace/request ID creation.
- Add health, readiness, and build metadata endpoints.
- Add formatting, linting, type checking, unit-test, build, and migration-check CI workflows.

### Affected modules

- root workspace configuration;
- `apps/web`;
- `apps/api`;
- `apps/worker`;
- `packages/contracts`;
- `packages/domain`;
- `packages/application`;
- `packages/database`;
- `packages/ui`;
- `packages/config`;
- `packages/observability`;
- `packages/testkit`;
- `infra/local`;
- CI configuration.

### Acceptance criteria

- One documented command starts all required local dependencies and processes.
- Web app renders without using API/provider secrets in the browser.
- API health distinguishes process liveness from database/storage readiness.
- Worker starts, reports readiness, and exits gracefully.
- A reversible no-data migration applies to a fresh database.
- Package-boundary rules prevent domain/application from importing framework/provider implementations.
- All root checks succeed from a clean clone.
- No feature package is created empty merely to match the target tree.

### Tests

- Unit: configuration validation and redaction.
- Contract: health/readiness response schemas.
- Integration: fresh PostgreSQL migration and readiness failure when DB is unavailable.
- Smoke: web, API, worker boot and graceful shutdown.
- CI: formatting, lint, type, unit, integration, build, migration drift.

### Verification artifact

A short runbook with commands and captured successful outputs for boot, health, tests, and clean shutdown.

## M01 — Premium design system and responsive application shell

### Outcome

The browser renders Yomirai’s Japanese-inspired dark shell with top bar, explorer, canvas, inspector, and command dock. Regions resize/collapse responsively and remain fully keyboard navigable, using fixture data only.

### Scope

- Implement semantic color, typography, spacing, radius, shadow, motion, and z-index tokens from the design docs.
- Load Latin/Japanese font stacks with safe fallbacks.
- Build foundational controls: button, input, icon button, badge, menu/popover, dialog/sheet, tabs, tooltip, skeleton/progress, focus ring.
- Build application shell regions and responsive panel behavior.
- Add English/Japanese localization infrastructure and locale-aware formatting helpers.
- Implement reduced-motion and density preferences locally.
- Add Storybook or equivalent isolated component workbench only if maintained by CI; otherwise use a component showcase route.

### Affected modules

- `apps/web`;
- `packages/ui`;
- `packages/contracts` for preference/locale read models if needed;
- `packages/config` for public UI configuration;
- visual regression and accessibility test setup.

### Acceptance criteria

- Shell matches the region hierarchy and token values in `docs/design`.
- Wide desktop shows explorer/canvas/inspector; tablet/mobile use sheets or single-surface composition.
- All interactive primitives expose visible focus and correct disabled/loading/error states.
- `prefers-reduced-motion` is honored before first animated render.
- UI remains usable at 320 CSS px and 200% browser zoom.
- English and Japanese fixture strings do not break primary controls.
- No essential action depends on hover, color alone, or animation completion.

### Tests

- Unit: token/preference and locale formatting helpers.
- Component: every primitive’s keyboard, focus, disabled, error, and loading behavior.
- Accessibility: automated axe scan of showcase and shell; landmark/name checks.
- Responsive: Playwright snapshots/behavior at mobile, tablet, desktop, and wide widths.
- Visual: baseline screenshots for core tokens and shell states.
- Motion: reduced-motion test asserts ambient/layout animation is disabled or replaced.

### Verification artifact

Component showcase plus shell screenshots at four breakpoints and a keyboard-only walkthrough.

## M02 — Authenticated workspace library and create/reopen flow

### Outcome

A signed-in user can create a workspace with title, goal, language, and source policy; see it in the workspace library; reopen it; and receive an empty workspace overview with starter destinations.

### Scope

- Implement auth adapter and session-to-actor resolution.
- Implement users, workspace memberships, workspaces, and workspace policy schema.
- Create workspace/list/get/update/archive use cases and API contracts.
- Enforce membership before workspace/resource disclosure.
- Build authentication entry, workspace library, new-workspace form, and empty overview.
- Create starter view navigation labels as read/UI configuration; do not create later view facts prematurely.
- Add workspace version `0` and timestamps.

### Affected modules

- `apps/web` auth/library/new workspace/overview routes;
- `apps/api` workspace routes and auth middleware;
- `packages/auth`;
- `packages/contracts`;
- `packages/domain/workspace`;
- `packages/application/workspaces`;
- `packages/database`;
- `packages/ui`;
- `packages/testkit`.

### Acceptance criteria

- Unauthenticated requests receive the typed auth error.
- User A cannot list, infer, open, update, or archive User B’s workspace.
- Create is idempotent by client/idempotency key.
- Library persists across restart and displays title, goal, locale, status, and updated time.
- Archived workspaces leave the default active list but remain recoverable through archived filter.
- Empty overview exposes begin research/add source/create object actions without requiring AI.
- UI restores intended destination after authentication where safe.

### Tests

- Domain: workspace state transitions and policy defaults.
- Application: create/list/get/archive use cases with fake repositories.
- Database integration: membership-scoped queries and unique idempotency behavior.
- API contract: auth, validation, not-found/forbidden non-disclosure.
- Component: form validation, pending/error, library empty/populated/archived states.
- E2E: sign in → create workspace → reopen → archive/filter.
- Accessibility: form errors, focus management, mobile library flow.

### Verification artifact

An end-to-end recording or trace showing create, restart/reopen, and cross-user denial.

## M03 — Manual finding through operation and commit

### Outcome

A user can manually create, inspect, edit, and archive a finding. Every mutation is expressed as a typed operation, applied transactionally, increments workspace/object versions, and creates an auditable commit.

### Scope

- Implement knowledge object envelope and MVP kinds needed by subsequent stages.
- Implement epistemic statuses and validation rules.
- Implement `object.create`, `object.update`, and `object.archive` operations.
- Implement application-controlled validation and transactional apply.
- Persist current state, applied operations, commit, actor, and outbox record atomically.
- Expose object list/detail/manual mutation APIs.
- Build findings list, object row, create/edit flow, and inspector details/history summary.
- Exclude archived objects by default.

### Affected modules

- `apps/web/features/object-inspector` and findings list;
- `apps/api` object/command routes;
- `packages/contracts` operation/object/commit schemas;
- `packages/domain/knowledge`;
- `packages/domain/changes`;
- `packages/application/knowledge`;
- `packages/application/changes`;
- `packages/database`;
- `packages/ui` object/status components;
- `packages/testkit` fixtures.

### Acceptance criteria

- Creating a finding produces workspace version `1`, object revision `1`, one commit, and one applied operation.
- Updating requires the current object revision and increments both object revision and workspace version.
- A stale revision returns a typed conflict and changes nothing.
- Archiving hides the object from default reads without deleting history.
- A `sourced_fact` without evidence cannot yet be created; manual unsupported content uses `user_assertion`, `hypothesis`, or `unknown`.
- Database failure rolls back object, operation, commit, version, and outbox together.
- Inspector clearly identifies committed state and epistemic status.

### Tests

- Domain: object and epistemic-status invariants; operation discriminated unions.
- Application: validate/apply create, update, archive, stale revision, forbidden actor.
- Database integration: atomicity, version locking, rollback, default archive filter.
- API contract: idempotency, optimistic concurrency, typed errors.
- Component: create/edit/archive and status explanation.
- E2E: create finding → edit → refresh → inspect commit summary → archive.

### Verification artifact

Database/API evidence that one UI mutation results in exactly one atomic commit and no direct table write path.

## M04 — Manual sources and claim-level evidence

### Outcome

A user can add a bibliographic/web source manually, create an exact evidence span, attach it to a finding as support or contradiction, and inspect the evidence from the finding.

### Scope

- Implement source, evidence span, and evidence link model.
- Add canonical URL/hash fields and basic duplicate detection.
- Implement source/evidence create/update and `evidence.attach`/`evidence.detach` operations.
- Enforce workspace boundary, source version/hash locator, and sourced-fact support invariant.
- Expose source list/detail/evidence APIs.
- Build source form/list, evidence plate, citation link, and inspector Evidence section.
- Allow a finding to transition to `sourced_fact` only in the same atomic commit that attaches supporting evidence.

### Affected modules

- `apps/web/features/object-inspector`;
- source/evidence web features;
- `apps/api` source/evidence routes;
- `packages/contracts`;
- `packages/domain/evidence`;
- `packages/domain/knowledge`;
- `packages/domain/changes`;
- `packages/application/changes` and evidence use cases;
- `packages/database`;
- `packages/ui` evidence/source components;
- `packages/testkit`.

### Acceptance criteria

- Evidence span resolves to a source and durable locator/hash.
- Cross-workspace evidence attachment is impossible.
- Supporting, contradicting, and contextualizing links are distinct and visible.
- One source span can support multiple findings without copying text into each finding.
- A sourced-fact transition and evidence attachment succeed or roll back together.
- Duplicate canonical URL/content hash produces reuse or explicit conflict, not a silent second source.
- Citation is keyboard accessible and opens the correct evidence detail.

### Tests

- Domain: evidence/directness/support invariants and sourced-fact rule.
- Application: atomic attach + status transition; detach downgrade/warning behavior.
- Database integration: cross-workspace constraints and source deduplication.
- API contract: invalid locator, unknown source, conflict responses.
- Component: evidence plate, support/contradiction labels, source detail.
- E2E: add source → create excerpt → attach → mark sourced fact → reopen from citation.
- Accessibility: source/citation names, non-color status communication.

### Verification artifact

One finding with supporting and contradicting spans that can each be traced to source metadata and locator.

## M05 — Relations and accessible local graph

### Outcome

A user can connect two canonical objects with a labeled directed relation and explore the selected object’s one- or two-hop neighborhood in both graph and semantic list forms.

### Scope

- Implement relation model, controlled predicates, and create/update/archive operations.
- Add neighborhood read query with depth and kind/predicate filters.
- Build graph view adapter, nodes/edges, controls, inspector relation detail, and equivalent list.
- Start from a selected seed; never render the entire workspace by default.
- Persist a simple graph view configuration only if the saved-view contract from M06 is available; otherwise preserve route/query state without creating a competing view model.

### Affected modules

- `apps/web/features/graph-view`;
- `apps/web/features/object-inspector`;
- `apps/api` relation/neighborhood routes;
- `packages/contracts`;
- `packages/domain/knowledge` relations;
- `packages/domain/changes`;
- `packages/application/knowledge`;
- `packages/database`;
- `packages/ui` graph relation components;
- `packages/testkit` graph fixtures.

### Acceptance criteria

- Relation endpoints must be active objects in the same workspace.
- Predicate aliases normalize to controlled keys or require explicit review.
- Direction and label are visible in graph and list.
- Default query is seed-based and depth-limited.
- Keyboard users can enter, traverse, inspect, and leave the graph; list provides full equivalent access.
- Reduced-motion mode uses a deterministic static layout.
- Archived relation disappears from active graph without removing commit history.

### Tests

- Domain: endpoint, predicate, revision, and archive invariants.
- Database integration: one/two-hop scoped traversal and cross-workspace exclusion.
- API contract: depth/filter limits and typed validation errors.
- Component: node/edge selection, inspector opening, filter behavior, list equivalence.
- E2E: create two objects → relate → graph neighborhood → inspect relation → archive.
- Accessibility: keyboard traversal, screen-reader node/edge summaries, reduced motion.

### Verification artifact

A seeded causal neighborhood rendered identically in graph and list, with an inspectable committed relation.

## M06 — Saved document and table views over canonical objects

### Outcome

A user can create saved document and table views that query/reference the same canonical objects, switch views without duplicating facts, and preserve filters/layout.

### Scope

- Implement saved view model, version, query definition, and layout configuration.
- Implement `view.create` and `view.update` operations.
- Build deterministic view-result service from canonical object/relation/evidence reads.
- Build document view with object embeds and table view with filter/sort/group basics.
- Share selection and inspector behavior across both views.
- Make post-commit writes visible in both views without copied content.

### Affected modules

- `apps/web/features/document-view`;
- `apps/web/features/table-view`;
- shared selection/view toolbar features;
- `apps/api` view routes;
- `packages/contracts`;
- `packages/domain/views`;
- `packages/domain/changes`;
- `packages/application` view queries/commands;
- `packages/database`;
- `packages/ui` table/document object embeds;
- `packages/testkit`.

### Acceptance criteria

- Saved view contains query/layout/reference data, not copied findings.
- Editing a canonical object updates both views after the same commit.
- Table filters/sorts are deterministic and survive reload.
- Document embedded object opens the same inspector record as its table row.
- Archived objects disappear unless the view explicitly includes archived state.
- Table supports keyboard selection and responsive row/card fallback.
- Document text measure and citation affordances follow the design spec.

### Tests

- Domain: view type/query validation and no-fact-payload invariant.
- Application: deterministic view results at a workspace version.
- Database integration: saved config/revision and canonical update propagation.
- API contract: invalid filter, stale view revision, pagination.
- Component: document/table render, selection preservation, filter persistence.
- E2E: create view pair → update finding → verify both views → reload.
- Accessibility/responsive: table semantics, mobile row fallback, document headings.

### Verification artifact

The same finding opened from two saved views with identical ID/revision and no duplicated storage record.

## M07 — Fixture-backed proposal review and atomic partial apply

### Outcome

A user can open a seeded change set, inspect a human-readable diff, accept/edit/reject individual operations, apply the valid subset atomically, or discard the proposal. No model is required.

### Scope

- Implement change-set/proposed-operation persistence and states.
- Implement temporary references, dependencies, risk, rationale, validation result.
- Add deterministic validation for object/view operations already supported.
- Implement apply selection, user payload edits, dependency pruning, revalidation, and atomic commit.
- Implement stale workspace/object conflict response.
- Build proposal review shell state, change navigator, natural-form preview, decisions, apply bar, and warnings.
- Add fixture/seed creation available only in test/development.

### Affected modules

- `apps/web/features/proposal-review`;
- `apps/api` change-set routes;
- `packages/contracts` change-set/decision/error schemas;
- `packages/domain/changes`;
- `packages/application/changes`;
- `packages/database`;
- `packages/ui` operation/diff components;
- `packages/testkit` proposal builders/fixtures.

### Acceptance criteria

- Raw model JSON is not the user-facing review representation.
- Rejected operations remain uncommitted and auditable in the proposal.
- User-edited payload is validated as if newly proposed.
- Rejecting a prerequisite removes/flags dependants deterministically.
- All accepted operations commit together or none do.
- Applying a stale proposal returns conflict and preserves review decisions.
- Discarding changes canonical workspace state by zero records.
- Applied proposal records originating change set, decisions, edits, and actor.

### Tests

- Domain: operation dependencies, states, temporary references, cycle rejection.
- Application: partial apply, user edit, dependency pruning, stale conflict, discard.
- Database integration: transaction rollback and unique apply/idempotency.
- API contract: decision schema, invalid edit, conflict payload.
- Component: keyboard review, grouped decisions, natural-form diff, warning focus.
- E2E: review fixture → edit one → reject one → apply → verify commit/state.
- Accessibility: inserted/deleted semantics, non-color operation state, focus after apply.

### Verification artifact

A recorded fixture scenario proving partial apply creates one commit containing only the accepted/edited valid operations.

## M08 — Commit history and compensating revert

### Outcome

A user can inspect a chronological commit list and structured commit detail, then revert a supported commit by creating a new compensating commit without erasing history.

### Scope

- Implement commit list/detail read models and filters.
- Implement inverse-operation generation for supported object/view operations.
- Validate revert against current state; surface conflicts instead of rewriting history.
- Add history UI, commit diff, actor/origin, current version, and revert confirmation.
- Link manual and proposal-originated commits to their source.

### Affected modules

- `apps/web/features/commit-history`;
- `apps/api` commit/revert routes;
- `packages/contracts`;
- `packages/domain/changes`;
- `packages/application/changes`;
- `packages/database`;
- `packages/ui` commit components;
- `packages/testkit`.

### Acceptance criteria

- Commit list is ordered and scoped to the workspace.
- Detail shows actor, origin, parent/current version, and normalized operations.
- Revert creates a new higher workspace version and compensating operations.
- Original commit remains immutable.
- Revert conflict identifies current-state blockers and applies nothing.
- History is usable with AI disabled.

### Tests

- Domain: inverse mapping for supported operations.
- Application: successful revert, repeated revert, stale/conflicting revert.
- Database integration: immutable history and atomic compensation.
- API contract: filters, pagination, typed conflict.
- Component/E2E: open history → inspect → revert → verify current state and both commits.
- Accessibility: chronological semantics, confirmation focus, explicit consequences.

### Verification artifact

A before/after workspace trace showing the original commit plus a later compensating commit.

## M09 — Workspace search and explicit command scope

### Outcome

A user can search workspace objects/sources lexically, select results across views, and see exactly which workspace, view, selection, or documents the command dock will use.

### Scope

- Implement authorization-scoped PostgreSQL full-text/structured search.
- Add filters by kind, status, date, and evidence state.
- Implement bounded context-bundle contract using exact selection plus lexical related results; vector retrieval comes later.
- Build search palette/results and cross-view selection model.
- Build command composer with visible scope chips, allow-web flag, desired mode, and attachments placeholder.
- Persist no assistant response yet; provide a deterministic scope preview/debug read model in development.

### Affected modules

- `apps/web/features/command-bar`;
- search/selection features;
- `apps/api` search/context-preview routes;
- `packages/contracts` scope/search/context schemas;
- `packages/application/knowledge`;
- `packages/retrieval` lexical/context builder;
- `packages/database` search indexes/queries;
- `packages/ui` search/scope chips;
- `packages/testkit` multilingual fixtures.

### Acceptance criteria

- Search never returns records from another workspace.
- Exact selected objects appear in context even when lexical rank is low.
- Archived objects are excluded by default.
- Scope never broadens from selection/documents to web without explicit user action.
- Context preview contains IDs/revisions and reports truncation/query metadata.
- English and Japanese fixture terms are searchable according to documented tokenizer limitations.
- Command dock is keyboard/mobile usable and does not imply a request has run.

### Tests

- Unit: scope normalization, token budgets, selection precedence.
- Database integration: workspace isolation, filters, ranking fixtures, archived exclusion.
- API contract: scope validation and pagination/limits.
- Component: search keyboard navigation, scope chip removal, selection persistence.
- E2E: find object → select → switch view → inspect scope preview.
- Accessibility: combobox semantics, announcements, mobile composer.

### Verification artifact

A context-preview fixture proving exact selection, bounded related content, revisions, and zero cross-workspace leakage.

## M10 — Non-persistent AI answer over workspace context

### Outcome

A user can ask a workspace-scoped question and receive a concise streamed or progressively rendered answer with links to existing objects/evidence. The answer is recorded as activity metadata but creates no canonical workspace object or commit.

### Scope

- Implement internal model-provider port and OpenAI Responses adapter.
- Add model-role configuration, prompt loader/version, usage/refusal/error normalization, and `store:false` default.
- Implement deterministic routing for explicit `answer` mode; ambiguous auto-routing can remain conservative.
- Build trusted request envelope and context serialization from M09.
- Add assistant request API and immediate answer response contract.
- Build answer/activity UI with references and “Save to workspace” disabled or explicitly marked as a future proposal action.
- Provide fake provider for all deterministic tests and opt-in live smoke/eval.

### Affected modules

- `apps/web/features/command-bar` and `activity-drawer`;
- `apps/api` assistant request route;
- `packages/contracts` assistant answer/error/usage schemas;
- `packages/application/research`;
- `packages/ai` provider, router, context serializer, prompt loader;
- `packages/retrieval`;
- `packages/config` model-role/provider settings;
- `packages/observability` model trace redaction;
- `packages/testkit` fake model provider;
- `prompts/router` and answer prompt;
- `evals/router` smoke fixtures.

### Acceptance criteria

- An explicit answer request never creates a knowledge object, change set, commit, or workspace version increment.
- Provider output cannot reference unknown object/evidence IDs without being downgraded to plain text or rejected.
- Only authorized context selected by M09 is sent to the provider.
- Refusal, timeout, rate limit, and malformed result map to typed UI states.
- Provider keys and raw prompts never reach the browser or default production logs.
- “What is a syrnyky recipe?” returns a non-persistent answer even inside a workspace.
- Usage, model role, snapshot, prompt version, latency, and trace ID are recorded.

### Tests

- Unit: router rules, prompt composition boundaries, reference validation, provider error mapping.
- Contract: fake/OpenAI adapter normalized response and refusal schemas.
- Application: answer path causes zero workspace writes.
- API contract: modes, typed errors, idempotency.
- Component/E2E with fake provider: submit → answer → follow object reference → refresh workspace unchanged.
- Security: prompt/source delimiters and log redaction assertions.
- Eval: small routing set covering answer versus persist requests and unrelated questions.

### Verification artifact

One trace showing the exact authorized context IDs, normalized answer, provider metadata, and unchanged workspace version.

## M11 — AI-generated direct change-set proposal

### Outcome

A user can ask Yomirai to create or organize workspace knowledge using only existing workspace context. The model returns typed proposed operations, deterministic validation produces a reviewable change set, and the user can edit/partially apply it through M07.

### Scope

- Extend router with `proposal` mode for create/update/organize intents.
- Define strict Structured Output schema mapped to supported domain operations.
- Implement proposal decoder, unknown-ID/temporary-reference handling, and one bounded repair attempt.
- Extend proposal validation and natural-form review to every operation variant delivered by M04–M06; unknown variants remain rejected.
- Run deterministic validation before persistence as `ready` or `invalid/partial` change set.
- Add prompt rules for minimum necessary operations, epistemic status, no invented evidence, and preserved uncertainty.
- Connect command result to proposal review; record original and validated outputs by safe reference/hash.
- Add operation acceptance/edit/rejection telemetry.

### Affected modules

- `apps/web/features/command-bar`, `activity-drawer`, `proposal-review`;
- `apps/api` assistant/change-set routes;
- `packages/contracts` router/proposal schemas;
- `packages/application/research` and changes;
- `packages/ai/orchestrator`, operations, provider structured output;
- `packages/domain/changes` validator extensions;
- `packages/database` execution/proposal metadata;
- `packages/observability`;
- `packages/testkit` fake structured outputs;
- `prompts/router`, `prompts/synthesizer`;
- `evals/router` and `evals/operations`.

### Acceptance criteria

- The model has no mutation tool and cannot bypass change-set review/apply.
- Every proposed target ID exists in the scoped context or is a valid temporary reference.
- Evidence, relation, and view operations use the same validator/authorizer/apply/diff path as their manual equivalents.
- Unsupported operations, invented evidence, cycles, oversized fields, and stale revisions are rejected deterministically.
- One malformed output can receive at most one constrained repair attempt.
- Proposal includes base workspace version, prompt/model/tool versions, rationale, validation results, usage, and warnings.
- Applying uses the existing M07 path without an AI-specific write implementation.
- A request such as “Turn these notes into two findings and one question” completes end to end.

### Tests

- Unit: structured decoder, ID validation, repair policy, minimum-operation rules.
- Contract: fake provider valid/malformed/refusal/unsupported operation fixtures.
- Application: AI run creates proposal only; apply remains separate authorized command.
- Integration: execution metadata and proposal persistence.
- Component/E2E: select notes → request → review → edit/reject/apply → inspect commit origin.
- Security: injected source/object text cannot change tool policy or add forbidden operations.
- Evals: operation validity/minimality, correct update-versus-create, scope adherence, false persistence.

### Verification artifact

An end-to-end trace from selected object IDs to model proposal, validation results, user decisions, and final commit.

## M12 — Secure PDF/text upload, parsing, and source reader

### Outcome

A user can upload an allowed PDF or plain-text file, see durable processing status, open sanitized extracted content with page/section locators, and delete/quarantine it according to policy. No embeddings or AI are required.

### Scope

- Implement upload initiation/completion, signed URLs, storage metadata, content hash, and file ownership.
- Validate declared size/type and actual signature; enforce decompression/page/time limits.
- Add malware-scan port with local fake/test implementation and production-required configuration.
- Implement sandboxed/resource-limited PDF and text parsing with parser version.
- Persist document, source, normalized content/chunks sufficient for reading, and locators.
- Run ingestion through M14’s durable queue/lease/idempotency foundation with ingestion-specific states; do not create a second job framework.
- Build upload UI, processing state, source reader, quarantine/failure state, and delete flow.

### Affected modules

- `apps/web` upload and source-reader features;
- `apps/api` upload/document/source routes;
- `apps/worker` ingestion handler;
- `packages/contracts` upload/document/status schemas;
- `packages/domain/evidence` document/source metadata;
- `packages/application/documents`;
- `packages/ingestion`;
- `packages/database`;
- object-storage adapter;
- `packages/config` limits;
- `packages/observability`;
- `packages/testkit` file/storage/parser fakes;
- `infra/local` object storage.

### Acceptance criteria

- Only the owning workspace can complete, read, or delete an upload.
- Actual signature is checked; executable/oversized/unsupported files are rejected or quarantined.
- Parser has no ambient provider/database credentials beyond the narrow job interface.
- PDF text retains page locators; text file retains line/section locators.
- Original and normalized content hashes plus parser version are stored.
- Re-upload of identical content is deduplicated or explicitly represented.
- Failed parsing does not expose partial unknown content as successfully indexed.
- Deletion removes original/derivatives and read records through an auditable durable action.

### Tests

- Unit: limits, signature detection, locator creation, parser status transitions.
- Parser fixtures: normal, empty, corrupt, encrypted, huge-page-count, malicious-name files.
- Storage integration: signed upload completion, ownership, delete lifecycle.
- Worker integration: retry/idempotency, crash recovery, quarantine.
- API contract: size/type/status/errors.
- Component/E2E: upload PDF → progress → reader page locator → delete.
- Security: path/key injection, archive bomb limits if archives are ever accepted, XSS-safe rendering.

### Verification artifact

A fixed PDF fixture opened at a known page excerpt plus logs/records proving ownership, hashes, parser version, and safe deletion.

## M13 — Hybrid document retrieval and cited answer

### Outcome

A user can ask a question scoped to uploaded documents and receive a non-persistent answer whose citations open the exact retrieved passage in the source reader.

### Scope

- Define chunking strategy that preserves document/source/locator/hash metadata.
- Add embeddings provider port and pgvector index.
- Implement hybrid lexical/vector retrieval, authorization filter, result limit, reranking baseline, and truncation notes.
- Extend context builder with document chunks and evidence IDs.
- Implement cited document-answer schema and validation that every citation resolves to a retrieved chunk/span.
- Build citation navigator from answer to source reader.
- Record retrieval queries, selected chunk IDs, versions, usage, and latency.

### Affected modules

- `apps/web/features/command-bar`, activity answer, source reader;
- `apps/api` assistant/document-search routes;
- `apps/worker` indexing handler;
- `packages/contracts` retrieval/citation schemas;
- `packages/application/research`;
- `packages/retrieval`;
- `packages/ingestion` chunk/index integration;
- `packages/ai` answer prompt/provider;
- `packages/database` pgvector/indexes;
- `packages/testkit` deterministic embedding/retrieval fixtures;
- `prompts` document answer;
- `evals/retrieval` and citation fixtures.

### Acceptance criteria

- Retrieval is filtered by workspace/document scope before results reach the model.
- Citation IDs can only reference retrieved, authorized, current source spans.
- Clicking a citation opens the exact page/section and highlights the excerpt.
- Answer path creates no canonical finding/commit.
- Result count and context size are bounded and report truncation.
- Lexical fallback works when embeddings are unavailable and exposes the limitation.
- Embedded malicious instructions are treated as content and cannot invoke tools/mutations.

### Tests

- Unit: chunk/locator preservation, hybrid score combination, citation resolution.
- Database integration: pgvector/lexical queries, workspace isolation, current-index version.
- Application: context budget and zero-write answer path.
- Contract: embedding/provider adapter and citation schema.
- E2E: upload fixture docs → index → ask known question → open correct citation.
- Evals: retrieval recall@k, irrelevant-context rate, citation correctness, injection resistance.
- Accessibility: citation link names, source-reader focus/highlight.

### Verification artifact

A golden question with expected passages and an answer whose every citation resolves to an allowed locator.

## M14 — Durable background jobs and SSE progress

### Outcome

A user can start a fixture-backed multi-stage workspace job, watch ordered progress in the activity drawer, minimize/reconnect, cancel, and safely retry. The job framework does not yet perform research.

### Scope

- Implement research job/attempt schema, states, stage transitions, budgets, leases, idempotency, and cancellation token.
- Implement PostgreSQL-backed queue and worker stage runner.
- Add transactional outbox dispatcher and ordered workspace/job SSE events.
- Add polling fallback and `Last-Event-ID` resume.
- Build activity center/drawer with stage, progress, warning, completed/failed/cancelled states.
- Create deterministic fixture workflow for verification only.

### Affected modules

- `apps/web/features/activity-drawer` and activity center;
- `apps/api` jobs/events routes;
- `apps/worker` workflow runner;
- `packages/contracts` job/event/error schemas;
- `packages/domain/research`;
- `packages/application/research`;
- `packages/database` queue/outbox/jobs;
- `packages/observability` tracing;
- `packages/config` concurrency/budgets;
- `packages/testkit` controllable fixture workflow/clock.

### Acceptance criteria

- Job and every transition persist before being announced.
- Events are ordered per job and reconnect resumes without duplicates or gaps.
- Cancel stops scheduling new stages and reaches terminal `cancelled` safely.
- Retry is allowed only for classified states and does not duplicate produced records.
- Expired worker lease can be reclaimed.
- User can navigate/manual-edit while job runs.
- Progress copy reports observable stages, never hidden chain-of-thought.
- Provider outage is not required to verify this stage.

### Tests

- Domain: legal/illegal state transitions, budgets, cancel/retry policy.
- Database integration: lease reclaim, idempotency, outbox atomicity, event sequence.
- Worker integration: crash between stage and event, cancellation, retry.
- API/SSE contract: auth, resume, polling, typed terminal states.
- Component/E2E: start fixture job → minimize → reconnect → cancel; separate failure/retry case.
- Accessibility: restrained live-region announcements and no focus theft.

### Verification artifact

A deterministic trace covering start, ordered SSE, disconnect/resume, cancellation, and retry without duplicate state.

## M15 — Document research job producing an evidence-backed proposal

### Outcome

A user can ask a bounded question across uploaded documents, watch the durable research stages, receive findings/questions/relations linked to exact evidence, partially apply them, and inspect the resulting commit.

### Scope

- Implement document research planner with explicit scope, questions, output, stop conditions, and budgets.
- Add read-only `documents.search`, `workspace.search`, `workspace.get_objects`, and `research.report_gap` tools.
- Implement staged gathering, source-local extraction, synthesis, deterministic validation, and optional semantic verification.
- Normalize extracted spans into proposed source/evidence operations without directly mutating canonical state.
- Connect job completion to M07 review and M11 operation schemas.
- Handle no evidence, conflicting evidence, partial coverage, refusal, and budget exhaustion.

### Affected modules

- `apps/web` command/activity/proposal/evidence flows;
- `apps/api` assistant/job/change-set integration;
- `apps/worker` document research workflow;
- `packages/contracts` plan/tool/extraction/proposal schemas;
- `packages/application/research`;
- `packages/ai/orchestrator`, tools, extraction, synthesis, verification;
- `packages/retrieval`;
- `packages/domain/research`, evidence, changes;
- `packages/database` run/tool/extraction traces;
- `packages/observability` usage/cost/stage traces;
- `packages/testkit` scripted tool/model runs;
- `prompts/planner`, `extractor`, `synthesizer`, `verifier`;
- `evals/extraction`, synthesis, operations, end-to-end.

### Acceptance criteria

- Research scope cannot expand beyond selected documents/workspace without a new user request.
- All tool calls are read-only, allowlisted, argument-validated, and budgeted.
- Extractions preserve exact source locator/hash and source-local wording.
- Proposed sourced facts include supporting evidence; unsupported synthesis is inference/hypothesis/question.
- Conflicting evidence is preserved as disputed/conflict output.
- Budget exhaustion yields a partial proposal/gap report, not fabricated completion.
- No stage writes canonical workspace state.
- Applying selected output uses M07 and creates one auditable commit.

### Tests

- Unit: plan/budget/stop conditions, tool allowlist, extraction normalization, conflict behavior.
- Contract: scripted model/tool stage inputs and outputs.
- Worker integration: stage persistence, cancellation, retry, partial failure.
- Security: prompt injection corpus cannot call mutation/external tools or widen scope.
- E2E with deterministic providers: document request → progress → evidence proposal → partial apply → commit.
- Evals: extraction span accuracy, claim/evidence entailment, epistemic status, contradiction retention, operation validity.
- Accessibility: long-job progress and proposal/evidence review.

### Verification artifact

A golden multi-document scenario with expected evidence spans and an applied subset traceable from commit back to extraction and source.

## M16 — Web search normalization and cited web answer

### Outcome

A user can explicitly allow web search, ask a current-information question, receive a non-persistent answer with visible clickable citations, and inspect normalized source metadata without creating canonical findings.

### Scope

- Implement provider web-search tool adapter and source/citation normalizer.
- Enforce source policy, domain restrictions, query/tool-call budgets, and safe URL handling.
- Normalize URL, title, provider citation locator, access date, and consulted-source trace.
- Deduplicate against existing workspace sources by canonical URL/hash where content is available.
- Extend answer routing with explicit web permission and cited answer schema.
- Build web citation display/source detail and complete consulted-source disclosure where provided.
- Do not add arbitrary general URL fetching beyond reviewed safe-source adapter.

### Affected modules

- `apps/web` command scope, answer citations, source detail;
- `apps/api` assistant route;
- `packages/contracts` web source/citation/tool schemas;
- `packages/application/research`;
- `packages/ai/tools/web-search` and provider citation normalizer;
- `packages/domain/evidence` source metadata;
- `packages/database` execution/consulted-source metadata;
- `packages/config` source policy/budgets;
- `packages/observability`;
- `packages/testkit` fake web results;
- `prompts` cited web answer;
- `evals` web citation fixtures.

### Acceptance criteria

- Web search runs only when scope explicitly allows it.
- Citations are visible, clickable, and resolve to normalized allowed URLs.
- Provider citation IDs/annotations are preserved in execution trace but not treated as canonical object IDs.
- Answer creates no finding/change set/commit.
- Restricted domains and unsafe URL schemes/hosts are rejected before opening/display.
- Duplicate URLs normalize consistently.
- Tool-call and spend budgets stop additional searches.
- Failed/partial search produces a typed limitation, not uncited current claims.

### Tests

- Unit: URL canonicalization, policy evaluation, citation normalization, budget counters.
- Contract: provider web-search output variants and missing citation fields.
- Application: permission gate and zero-write answer path.
- Security: SSRF/unsafe scheme/private host/redirect test corpus for any fetch layer.
- Component/E2E with fake provider: allow web → answer → open citations; deny web → no tool call.
- Evals: citation presence/relevance and source-policy adherence.

### Verification artifact

A trace showing explicit permission, bounded search actions, normalized citations, and unchanged workspace version.

## M17 — Bounded web research job producing a proposal

### Outcome

A user can start bounded cited web research, follow durable progress, review evidence-backed findings/relations/questions, apply a subset, and later reopen the workspace without relying on provider conversation history.

### Scope

- Extend planner with web queries, preferred source classes, source restrictions, and stop criteria.
- Implement bounded search/open/find loop within M14 job stages.
- Add source canonicalization, quality metadata, marginal-novelty and coverage tracking.
- Extract evidence from provider citations/allowed content with durable locator semantics supported by source policy.
- Synthesize and verify proposal using existing M15/M11 operation and evidence rules.
- Expose consulted sources, uncovered questions, conflicts, budgets, and partial completion.
- Add follow-up request using canonical workspace retrieval, not indefinite provider response chain.

### Affected modules

- `apps/web` command/activity/proposal/source flows;
- `apps/api` research/job integration;
- `apps/worker` web research workflow;
- `packages/contracts` web plan/coverage/trace schemas;
- `packages/application/research`;
- `packages/ai/orchestrator`, web tools, extraction, synthesis, verifier;
- `packages/retrieval` context builder;
- `packages/domain/evidence`, research, changes;
- `packages/database` sources/evidence/run trace;
- `packages/config` budgets/circuit breakers;
- `packages/observability`;
- `packages/testkit` scripted web corpus;
- `prompts` research stages;
- `evals` web end-to-end/adversarial suites.

### Acceptance criteria

- Default loop respects configured rounds, queries, source count, retries, time, tokens, and spend.
- Stop evaluator terminates on sufficiency, no-new-information, cancellation, or budget exhaustion.
- Sources and evidence persist in Yomirai proposal data with traceable origin.
- Claim/evidence and epistemic-status rules match document research.
- Prompt injection in web content cannot alter tool policy, scope, or operation vocabulary.
- User can inspect all cited and consulted sources exposed by the provider.
- Partial/failed sources do not invalidate valid evidence; gaps remain visible.
- Follow-up after refresh uses canonical applied workspace state and bounded new context.

### Tests

- Unit: coverage/novelty/stop evaluator, source canonicalization, retry/circuit policy.
- Contract: scripted multi-round provider/tool traces.
- Worker integration: budget stop, cancellation, transient retry, partial source failure.
- Security: malicious web corpus and URL policy.
- E2E deterministic: run → SSE → proposal → evidence inspection → partial apply → refresh/follow-up.
- Evals: multi-domain usefulness, source diversity, claim support, contradiction handling, operation validity, cost/latency envelope.

### Verification artifact

A fully replayable deterministic research trace and one opt-in live smoke report meeting the agreed factual-support/budget thresholds.

## M18 — Public landing page and acquisition entry

### Outcome

A visitor can understand Yomirai’s workspace-over-chat proposition, see the prompt → proposal → views workflow, navigate responsively/accessibly, and enter authentication or beta signup.

### Scope

- Implement public header, hero, problem contrast, three-step product proof, evidence/trust section, closing CTA, and footer.
- Use product fixtures captured from completed core flows; never fake unsupported capability.
- Implement restrained Japanese-inspired art direction, motion, and reduced-motion alternative.
- Add metadata, social preview, structured content/SEO basics, privacy/terms links, and acquisition event schema.
- Connect CTA to real M02 authentication or approved beta signup.

### Affected modules

- `apps/web` public routes;
- `packages/ui` marketing compositions;
- `packages/config` public URLs/metadata;
- localization content;
- analytics/observability adapter limited to approved events;
- static assets.

### Acceptance criteria

- Hero clearly states that research becomes structured, reviewable knowledge.
- Demonstrated features exist in product or are labeled as preview.
- CTA completes to authentication/signup and preserves campaign/referrer safely.
- Page is responsive from 320 px through wide desktop.
- Reduced motion removes ambient/sticky animation without hiding content.
- Performance targets and accessibility checks pass on representative mobile/desktop runs.
- No stereotypical/ornamental Japanese motifs prohibited by the design spec.

### Tests

- Component: navigation, CTA, content order, reduced-motion variants.
- E2E: landing → auth/signup entry.
- Accessibility: landmarks, headings, keyboard menu, contrast, zoom.
- Responsive visual regression at four breakpoints.
- Performance: bundle/image/font budgets and automated Lighthouse-style baseline.
- Content: link checker, metadata, no unsupported product claims.

### Verification artifact

Mobile/desktop audit reports plus CTA E2E trace and approved content screenshots.

## M19 — Security and data-lifecycle closure

### Outcome

All implemented MVP paths have explicit security controls and a verified data lifecycle. A user can export and delete a workspace, and the system proves isolation and cleanup across database, object storage, vector indexes, jobs, and provider resources.

### Scope

- Re-run the threat model against authenticated resources, operations, search, uploads, jobs/SSE, prompt boundaries, and web URL handling.
- Close critical/high findings without adding new product capability.
- Implement workspace export and durable deletion workflow.
- Map deletion/retention to database rows, object-store originals/derivatives, vector indexes, execution traces, and provider-side resources.
- Finalize content-security headers, cookie/session policy, input/output sanitization, secret handling, and administrative access audit.
- Consolidate adversarial corpora for tenant isolation, prompt injection, SSRF, malicious files, and model operations.

### Affected modules

- `apps/api` security middleware and deletion/export routes;
- `apps/worker` deletion/cleanup handlers;
- `packages/auth`;
- `packages/application` export/deletion use cases;
- `packages/database`;
- object-storage/provider adapters;
- `packages/ingestion` and web-source policies;
- `packages/config` security/retention policy;
- `packages/observability` redaction/audit;
- security test fixtures and documentation.

### Acceptance criteria

- No critical/high unresolved security finding in required MVP paths.
- Cross-workspace isolation passes API, database, search, SSE, upload, job, source, evidence, proposal, and commit tests.
- Export contains authorized canonical data, provenance, and history in a documented format without secrets/internal traces.
- Deletion is idempotent, auditable, retryable, and reaches a terminal verified state.
- Cleanup covers canonical rows, stored files/derivatives, embeddings/indexes, queued jobs, and provider resources according to policy.
- Prompt-injection, SSRF/private-host, malicious upload, and forbidden-operation corpora pass.
- Default production logs/traces do not contain raw sensitive source content, prompts, credentials, or signed URLs.

### Tests

- Tenant-isolation regression across every resource class and transport.
- Security headers/session/cookie/input-sanitization tests.
- Upload/parser, web URL, prompt-injection, and malicious operation adversarial suites.
- Export authorization/schema/content tests.
- Deletion integration: partial failure, retry, idempotency, provider/storage cleanup.
- Audit/redaction tests.

### Verification artifact

Threat-model closure report plus an export/deletion trace accounting for every storage/provider class.

## M20 — Observability, resilience, and performance budgets

### Outcome

Operators can trace a user request through API, queue, worker, model/tools, proposal, and commit; detect failures and budget breaches; and recover from expected dependency outages without corrupting workspace state.

### Scope

- Complete trace propagation, structured redacted logs, metrics, dashboards, and actionable alerts.
- Finalize rate limits, workspace/user concurrency, upload/search/model/tool/job budgets, and circuit breakers.
- Add typed degradation behavior for database read pressure, vector unavailability, object storage, provider outage, lost SSE, and worker crash.
- Run queue lease/retry/idempotency and transactional-outbox failure drills.
- Establish realistic large-workspace fixtures and performance baselines.
- Run database backup/restore and object metadata recovery drill.

### Affected modules

- all deployable apps for instrumentation;
- `packages/observability`;
- `packages/config` budgets/rate limits;
- API/worker middleware;
- database queue/outbox/search queries;
- provider/storage/retrieval adapters;
- load/chaos fixtures;
- operational runbooks.

### Acceptance criteria

- One trace correlates request, workspace, job, tool/model calls, proposal, and commit without exposing sensitive content.
- Metrics cover latency/errors, queue age, stage duration, provider usage/cost, operation decisions, conflicts, and citation coverage.
- Rate/budget limits stop work predictably with typed user-visible states.
- Provider outage leaves manual workspace work usable and jobs safely queued or failed.
- Lost SSE resumes or falls back to polling without duplicate events/actions.
- Worker crash/lease expiry/retry does not duplicate sources, proposals, commits, or costs beyond documented external-call limits.
- Backup/restore drill recovers a workspace and history within the approved recovery objective.
- Performance reports meet approved API/UI/job budgets on realistic fixtures.

### Tests

- Trace/log/metric contract and redaction tests.
- Rate-limit, timeout, circuit-breaker, retry, cancellation, and lease-recovery tests.
- Outbox/event duplication and disconnect/resume chaos cases.
- Provider/storage/vector degradation E2E cases.
- API/search/SSE/worker load smoke with large workspaces.
- Database backup/restore and object-reference reconciliation drill.

### Verification artifact

Observability dashboard/trace samples, resilience drill report, and signed performance/budget baseline.

## M21 — Accessibility, responsive, and localization closure

### Outcome

Every critical MVP journey is usable by keyboard and assistive technology, reflows on mobile/tablet/desktop, respects reduced motion/high contrast, and handles reviewed English/Japanese UI copy.

### Scope

- Run the full critical-flow WCAG 2.2 AA matrix and close gaps.
- Complete focus management, announcements, graph list equivalence, proposal diff semantics, source/citation navigation, and long-job progress behavior.
- Verify 320 CSS px reflow, 200% zoom, touch targets, forced colors, and reduced motion.
- Finalize English/Japanese glossary and required beta translations.
- Validate long English and Japanese content in tables, graph labels, dialogs, command scope, errors, and marketing.
- Finish responsive behavior for proposal review, source reader, document/table/graph, history, and activity drawer.

### Affected modules

- `apps/web` critical routes/features;
- `packages/ui` primitives and accessible composites;
- localization resources/glossary;
- accessibility/visual regression test configuration;
- design documentation only where implementation findings require clarification.

### Acceptance criteria

- Critical journeys pass automated scan with no serious/critical issues and complete documented manual checks.
- All journeys are completable keyboard-only with logical focus order/return.
- Graph has full semantic list alternative; no information depends only on pointer, motion, or color.
- 320 px reflow and 200% zoom preserve primary reading, asking, review, apply, citation, and revert flows.
- Reduced-motion mode removes ambient/spatial movement while preserving state feedback.
- English/Japanese reviewed copy does not clip critical controls and uses locale-aware formats.
- Screen-reader progress announcements are meaningful and not noisy.

### Tests

- Automated axe scans for all critical screens/states.
- Playwright keyboard-only journeys and focus assertions.
- Screen-reader manual scripts for proposal, graph/list, citations, and job progress.
- Responsive visual/behavior matrix at four breakpoints, 200% zoom, and 320 px reflow.
- Reduced-motion and forced-color tests.
- English/Japanese long-string and locale-format fixtures.

### Verification artifact

Accessibility conformance matrix with screenshots/traces for responsive, reduced-motion, keyboard, and bilingual cases.

## M22 — Beta deployment and release certification

### Outcome

The verified MVP is deployed to a beta environment through a reproducible pipeline, and a readiness report proves every product, quality, security, recovery, accessibility, evaluation, and rollback gate.

### Scope

- Create/finalize beta deployment definitions, secret management, environment validation, migration job, object storage, database/pgvector, worker scaling, and domain configuration.
- Document and exercise deploy, migration, rollback, backup/restore escalation, provider outage, and incident response.
- Run the permanent deterministic suite, security/accessibility matrices, offline evals, approved live model/web canary, and usability acceptance scenarios against beta-like configuration.
- Verify public-site claims and acquisition entry against deployed capabilities.
- Produce release checklist, build/model/prompt/tool versions, known risk register, and beta readiness report.

### Affected modules

- `infra/deploy`;
- CI/CD workflows;
- environment/secret configuration;
- migration and operational scripts/runbooks;
- `evals` reports;
- public/product configuration;
- documentation links to generated evidence.

### Acceptance criteria

- Clean environment deploy succeeds without manual database edits.
- Forward migration and tested rollback/redeploy procedure preserve workspace data.
- All M19 security, M20 resilience/performance, and M21 accessibility gates are linked and passing.
- Offline eval thresholds and approved live canary cost/latency/factual-support limits pass on pinned model/prompt/tool versions.
- Critical E2E journeys pass against the beta environment.
- Public website claims only deployed capability.
- Runbooks identify owners, commands, safe rollback points, and trace/dashboard locations.
- Known risks have severity, owner, mitigation, and review date.

### Tests

- Infrastructure validation and clean-environment deployment smoke.
- Migration compatibility and rollback/redeploy drill.
- Full deterministic regression/E2E suite in beta-like environment.
- Approved live provider/web canary.
- Security, accessibility, performance, deletion, and recovery report verification.
- Post-deploy smoke and synthetic health/job/citation journey.

### Verification artifact

A signed beta readiness report linking every release gate to reproducible evidence, deployed versions, accepted risks, and rollback plan.
