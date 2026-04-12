# ADR-0001: Provide both registry and inline APIs for problem type construction

## Status

Accepted

## Context

RFC 9457 §4 defines a Problem Type as a URI-identified category of errors. Two design
patterns are common for how applications define these:

1. **Inline construction**: every throw site writes out the full `{ type, status, title, ... }` literal
2. **Centralized registry**: a single source of truth for all problem types, with throw sites referencing keys

Inline-only APIs optimize for first-use simplicity but cause drift once the same error
is thrown from more than one handler — `type` URIs get misspelled, `status` / `title`
pairs drift out of sync, and renames require grepping the codebase.

Registry-only APIs optimize for consistency but impose overhead on one-off errors,
prototypes, and generic 4xx / 5xx cases where `about:blank` is the correct `type`. Forcing
a registry entry for every throw creates meaningless ceremony, and RFC 9457 explicitly
allows `about:blank` when the HTTP status code alone is sufficient context.

## Decision

This middleware ships **both** APIs, deliberately unranked:

- `problemDetails(input)` — inline factory, returns a `ProblemDetailsError` instance
- `createProblemTypeRegistry(definitions)` — factory for a typed registry, returns a
  `.create(key, options)` method

The README guidance points users to the registry when the same error is thrown from more
than one handler, and to the inline factory otherwise. `createProblemTypeRegistry` builds
on top of `problemDetails` internally (see `src/registry.ts`), so the registry is a strict
superset of the inline API — no code duplication.

Neither API requires the other. A project can adopt `problemDetails()` alone and never
touch the registry, or vice versa.

## Consequences

**Positive**:

- Low friction for first use: `throw problemDetails({ status: 404, title: "Not Found" })`
  works without setup
- No ceremony for prototypes or truly one-off errors
- Registry users get typed keys, IDE autocomplete, and single-source-of-truth for
  `type` / `status` / `title`
- Migrating from inline to registry is additive — existing throws keep working

**Negative**:

- Two ways to do the same thing. Users must read the README to know which fits their case
- The registry API is discoverable only via the README or docs; there is no lint rule
  that pushes users toward it when repetition emerges
- Mixing both patterns in one codebase is technically possible and may confuse readers
