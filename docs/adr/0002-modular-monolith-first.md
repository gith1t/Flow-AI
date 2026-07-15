# ADR 0002: Start with a modular monolith

- Status: Accepted
- Date: 2026-07-15

## Context

Workspace commits touch objects, relations, evidence, views, audit records, and events atomically. The initial team and traffic do not justify distributed ownership, while background AI and ingestion work still need independent runtime scaling.

## Decision

Use a TypeScript modular monolith with explicit domain/application/infrastructure boundaries. Deploy web, API, and worker as separate processes from one monorepo. Use one PostgreSQL database and a transactional outbox.

## Consequences

### Positive

- Simple atomic commits and consistency.
- Low operational overhead.
- Shared contracts without network hops.
- Worker concurrency can scale separately.
- Boundaries provide a migration path if measured needs emerge.

### Negative

- Discipline is required to prevent cross-module coupling.
- One database can become a coordination point.
- Deployment is not independently versioned per module.

## Extraction criteria

A module becomes a service only when at least one is true:

- resource profile harms other workloads;
- independent scaling creates material savings;
- security isolation requires a harder boundary;
- a separate team owns its lifecycle;
- availability needs differ substantially.

## Rejected alternatives

- Microservices from day one: adds distributed transactions, contracts, deployment, and observability before product fit.
- Single Next.js process for everything: long jobs and parsing need durable, independent worker execution.
- Serverless functions only: awkward for multi-stage jobs, parsers, and controlled cancellation without additional orchestration.
