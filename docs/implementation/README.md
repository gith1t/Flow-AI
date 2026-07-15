# MVP implementation plan

This plan translates Yomirai’s product, architecture, AI, API, security, and design specifications into small cumulative vertical stages. It is an execution plan only; it does not start implementation.

## Plan documents

| Document | Purpose |
| --- | --- |
| [Vertical stages](01-mvp-vertical-stages.md) | The ordered MVP increments, affected modules, acceptance criteria, and stage-specific tests |
| [Dependencies and parallelism](02-dependencies-and-parallelism.md) | Exact dependency graph, critical path, parallel lanes, and coordination rules |
| [Verification and release gates](03-verification-and-release-gates.md) | Cross-stage test strategy, evidence required at handoff, and beta release gate |

## Execution rule

Every stage is a mergeable vertical slice. It must:

1. deliver a user-visible or operator-verifiable result;
2. depend only on completed predecessor stages;
3. leave the repository buildable, testable, and documented;
4. use real domain/application paths rather than throwaway parallel implementations;
5. include deterministic tests and, where relevant, isolated provider evals;
6. be scoped so one agent can implement, verify, and hand it off;
7. avoid assuming that any subsequent stage will be completed.

Fixture or fake adapters are allowed only at an explicit port. For example, the change-set review stage may use a seeded change set before AI generation exists. The review and commit behavior must still be production code; only the upstream producer is substituted.

## Planning baseline

The plan uses the technology direction already selected in the architecture docs:

- pnpm workspaces and Turborepo;
- TypeScript;
- Next.js/React web application;
- Fastify API;
- separate worker process from the same modular monolith;
- PostgreSQL with pgvector;
- Drizzle as the planning-default SQL layer;
- PostgreSQL-backed durable queue;
- S3-compatible object storage;
- OpenAI Responses API behind an internal provider port;
- Server-Sent Events for progress;
- Vitest, Testing Library, Playwright, and axe-compatible accessibility checks.

If implementation chooses a different query layer, queue, auth provider, graph renderer, or deployment platform, record that as an ADR before the affected stage. Do not change the domain or API boundary merely to match a vendor SDK.

## MVP assumptions

To make the plan executable, it assumes:

- first beta is single-user from a product perspective, while data remains membership-scoped;
- initial roles are `owner`, `editor`, and `viewer`, but only owner flow is exposed until required;
- initial document types are PDF and plain text; HTML upload, DOCX, and datasets follow later;
- provider response storage is disabled by default unless a reviewed policy says otherwise;
- uploaded-file retrieval is Yomirai-managed with PostgreSQL/pgvector;
- web research uses provider web-search results normalized into Yomirai sources/evidence;
- English and Japanese UI infrastructure starts with the shell, while complete translated copy can follow before beta;
- timeline is optional after the core MVP because the product definition requires document, table, and graph views;
- arbitrary code execution, SQL execution, collaboration, monitoring, CRDT, and multi-agent orchestration remain out of scope.

## Stage map

| ID | Vertical result | Critical path? |
| --- | --- | --- |
| `M00` | Executable monorepo and local runtime spine | Yes |
| `M01` | Premium accessible design system and responsive shell | Yes |
| `M02` | Authenticated workspace library and create/reopen flow | Yes |
| `M03` | Manual finding saved through operation → commit | Yes |
| `M04` | Manual sources and claim-level evidence | Yes |
| `M05` | Relations and accessible local graph | No; required by final MVP |
| `M06` | Saved document and table views over canonical objects | No; required by final MVP |
| `M07` | Fixture-backed proposal review and atomic partial apply | Yes |
| `M08` | Commit history and compensating revert | No; required by final MVP |
| `M09` | Workspace search and explicit command scope | Yes |
| `M10` | Non-persistent AI answer over workspace context | Yes |
| `M11` | AI-generated direct change-set proposal | Yes |
| `M12` | Secure PDF/text upload, parsing, and source reader | Yes |
| `M13` | Hybrid document retrieval and cited answer | Yes |
| `M14` | Durable background jobs, SSE progress, cancel, retry | Yes |
| `M15` | Document research job producing an evidence-backed proposal | Yes |
| `M16` | Web search normalization and cited web answer | Yes |
| `M17` | Bounded web research job producing a proposal | Yes |
| `M18` | Public landing page and acquisition entry | Parallel beta requirement |
| `M19` | Security and data-lifecycle closure | Yes |
| `M20` | Observability, resilience, and performance budgets | Yes |
| `M21` | Accessibility, responsive, and localization closure | Yes |
| `M22` | Beta deployment and release certification | Yes |

## What is deliberately not combined

- Authentication/workspace ownership is completed before knowledge features.
- Manual operations and commits exist before AI proposals.
- Proposal review/apply exists before a model can generate operations.
- Secure parsing exists before embeddings/retrieval.
- Cited document answers exist before multi-stage document research.
- Durable jobs exist before either long document or web research loops.
- Web citation normalization exists before bounded web synthesis.
- Final hardening verifies existing behavior; it does not introduce a new product capability.

This order turns high-risk boundaries into tested prerequisites instead of debugging them all inside the final research workflow.
