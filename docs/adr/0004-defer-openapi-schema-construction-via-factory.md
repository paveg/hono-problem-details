# ADR-0004: Defer OpenAPI schema construction via factory function

## Status

Accepted. The rationale was re-verified on 2026-11-27 and does not hold; see
[Addendum: rationale re-verified](#addendum-rationale-re-verified-2026-11-27). The
decision itself stands.

## Context

The `./openapi` integration exported `ProblemDetailsSchema` as a module-top-level
const built by chaining `z.string().openapi(...)` calls. This works in
single-`zod`-instance environments, but fails with
`TypeError: e.string(...).openapi is not a function` whenever the bundler resolves
two copies of `zod` — one patched by `@hono/zod-openapi`'s prototype extension,
one not. This was reported in [issue #133][issue] against a large Cloudflare
Workers bundle (esbuild via `wrangler deploy`), and is reproducible whenever
pnpm strict hoisting, npm peer-mismatch, or monorepo layouts duplicate the `zod`
dependency.

The bug surface is module-load-time evaluation: by the time the consumer's first
line of code runs, the throw has already happened. There is no consumer-side
mitigation other than not importing the module.

### The failure mode

```mermaid
sequenceDiagram
    autonumber
    participant App as Consumer bundle
    participant ZA as zod (copy #1)
    participant HZO as @hono/zod-openapi
    participant ZB as zod (copy #2)
    participant HPD as hono-problem-details/openapi

    HZO->>ZA: extendZodWithOpenApi(zod)
    Note over ZA: ZodType.prototype.openapi = fn
    App->>HPD: import (module load)
    HPD->>ZB: z.string().openapi(...)
    Note over ZB,HPD: TypeError: .openapi is not a function
```

The patched prototype lives on `zod` copy #1. `hono-problem-details/openapi`'s
top-level body runs against copy #2, where the prototype is still vanilla.

### Repair strategies considered

Three repair strategies were considered:

1. **Proxy wrapper preserving the `ProblemDetailsSchema` const export** — wrap a
   lazily-constructed real schema in `new Proxy({}, { get, ... })`, forwarding
   method calls and property access. Preserves the existing API surface.
2. **Hybrid (Proxy + boundary-unwrap)** — same Proxy, but `problemDetailsResponse`
   internally resolves the Proxy to the real schema before handing it to
   `OpenAPIHono`.
3. **Factory function** — drop `ProblemDetailsSchema`, expose
   `getProblemDetailsSchema()` instead. Consumers call it explicitly. Breaking
   change to the public API.

An uncommitted throwaway spike (not preserved in the repository) verified all three
under `zod@4.3.6` + `@hono/zod-openapi@1.3.0` +
`@asteasolutions/zod-to-openapi@8.5.0`:

- **Proxy** core mechanics (`.shape`, `.safeParse`, `.extend`, `.openapi`) pass.
  But when the Proxy is registered as a route response schema in `OpenAPIHono`,
  the generated OpenAPI document loses `title: "ProblemDetails"`. Root cause:
  `zod-to-openapi` v8 stores metadata in a global `Map<ZodSchema, metadata>`
  keyed by schema identity (a Map-backed registry inside `@asteasolutions/zod-to-openapi`).
  The Proxy and its wrapped schema have different identities, so registry
  lookup fails.
- **Hybrid** repairs the bug only for consumers who route through
  `problemDetailsResponse`. Any consumer passing `ProblemDetailsSchema` directly
  to `OpenAPIHono` still sees the lost title. Worse, the Proxy hits invariant
  violations (`getOwnPropertyDescriptor` on `_zod`) when downstream code
  introspects Zod v4 internals — recoverable with more traps, but the complexity
  is unbounded.
- **Factory** works cleanly. Lazy by definition (no work at module load),
  identity-preserving (the returned schema is a real `ZodObject` the registry
  knows about), and immune to bundler-induced `zod` copies because `.openapi()`
  evaluation is deferred until the consumer's code is already running.

### Why Proxy cannot reach the registry

```mermaid
flowchart TD
    subgraph proxy[Proxy approach — fails]
        P1[ProblemDetailsSchema = Proxy wrapping lazy schema]
        P2[Consumer hands Proxy to OpenAPIHono]
        P3[zod-to-openapi: Map.get of Proxy]
        P4[Map key is the real ZodObject inside]
        P5[Lookup MISS — title undefined]
        P1 --> P2 --> P3 --> P4 --> P5
    end

    subgraph factory[Factory approach — works]
        F1[Consumer calls getProblemDetailsSchema]
        F2[Real ZodObject built and registered]
        F3[Consumer hands real schema to OpenAPIHono]
        F4[zod-to-openapi: Map.get of real schema]
        F5[HIT — title 'ProblemDetails']
        F1 --> F2 --> F3 --> F4 --> F5
    end
```

## Decision

Drop `ProblemDetailsSchema` (the const export) entirely. Replace with
`getProblemDetailsSchema()`, a memoized factory that returns the real
`z.ZodObject<{...}>` on demand. Update `createProblemDetailsSchema` and
`problemDetailsResponse` to call the factory internally — their public function
signatures stay the same.

This is a breaking change for `./openapi` consumers. It ships as v0.7.0
following the project's pre-1.0 convention of using minor bumps for breaking
changes (cf. v0.5.0 widening peer deps, v0.4.0 changing the `extensions.stack`
contract).

### Migration

```ts
// Before (v0.6.x)
import { ProblemDetailsSchema } from "hono-problem-details/openapi";
app.openapi(createRoute({
  responses: {
    400: { content: { "application/problem+json": { schema: ProblemDetailsSchema } }, description: "Bad Request" },
  },
}));

// After (v0.7.0) — option 1: bind locally
import { getProblemDetailsSchema } from "hono-problem-details/openapi";
const ProblemDetailsSchema = getProblemDetailsSchema();
app.openapi(createRoute({
  responses: {
    400: { content: { "application/problem+json": { schema: ProblemDetailsSchema } }, description: "Bad Request" },
  },
}));

// After (v0.7.0) — option 2: use the helper (preferred)
import { problemDetailsResponse } from "hono-problem-details/openapi";
app.openapi(createRoute({
  responses: { 400: problemDetailsResponse(400) },
}));
```

## Consequences

**Positive**:

- The bug is fixed at the root: schema construction can no longer execute before
  the consumer's bundle finishes resolving and patching `zod`.
- No Proxy machinery, no boundary-unwrap edge cases, no Zod v4 internal-coupling
  fragility.
- Identity contracts with `zod-to-openapi`'s registry are preserved.

**Negative**:

- Existing code that imports `ProblemDetailsSchema` as a value breaks. Migration
  is mechanical (`import { ProblemDetailsSchema }` →
  `const ProblemDetailsSchema = getProblemDetailsSchema()`), but visible.
- `getProblemDetailsSchema()` is memoized at module level via a closure, which
  restores referential identity for repeated callers within the same module
  instance — but cross-bundle duplicate-instance scenarios will produce one
  cached schema per bundle. This is acceptable because the alternative (sharing
  a registry across bundles) is what caused the original bug.
- README, type-compat tests, and downstream examples need updating.

## Regression tests

The following tests must land alongside the implementation to prevent recurrence:

1. **Lazy-eval test** — spy on `z.ZodType.prototype.openapi`, import the
   module, and assert the spy was NOT called; then call
   `getProblemDetailsSchema()` and assert the spy WAS called. Proves
   construction is deferred past module load.
2. **OpenAPI integration test** — assert that `getProblemDetailsSchema()`
   result, when registered with `OpenAPIHono`, emits `title: "ProblemDetails"`
   in the generated OpenAPI 3.1 document.
3. **Type-compat consumer** — `tests/type-compat/core-consumer.ts` must use
   `getProblemDetailsSchema()` so the TS 5.0/5.4/5.7/5.9/6.0 matrix guards the
   public API.

[issue]: https://github.com/paveg/hono-problem-details/issues/133

## Addendum: rationale re-verified (2026-11-27)

The failure mode in Context was never reproduced before v0.7.0 shipped. A later
re-check could not reproduce it either, and found a reason it cannot occur through
this module's own calls.

### Why `./openapi` always holds a patched `z`

`@hono/zod-openapi` imports `z` from `zod`, calls `extendZodWithOpenApi(z)`, and
re-exports that same `z` (`dist/index.mjs` lines 6, 265 and 312 in v1.6.3).
`./openapi` imports `z` from `@hono/zod-openapi`, so the instance it uses is the one
that copy of `@hono/zod-openapi` patched while it was evaluated, which completes
before `./openapi`'s body runs. Duplicating `zod` alone cannot hand this module an
unpatched instance.

### What was run

Fixtures used pnpm and npm installs, pnpm monorepos with diverging `zod` and
`@hono/zod-openapi` versions, bundles from `wrangler@4.90.0 deploy --dry-run` and
plain esbuild, a CJS `require()` of the module, mixed CJS/ESM loading, import
cycles, and esbuild code splitting. Every layout ran against 0.6.1 and 0.12.3. 0.7.0
ran in a subset: a single app, the pnpm monorepo with diverging `zod` versions, and the
npm-installed bundles with CJS, import cycles and splitting. Everything ran in Node
rather than workerd.

- No run threw `.openapi is not a function` from this module, including 0.6.1 with
  its module-top-level schema. (With `zod@3.25`, which `./openapi` does not support,
  0.6.1 threw a different error at load.) Without a failing 0.6.1 run, there is no evidence
  that deferring construction prevents the reported error.
- The reported message did appear when consumer code called `.openapi()` on its own
  `import { z } from "zod"` that resolved to a different, unpatched copy. Whether
  that is what happened in the issue's Worker is unknown.

### What duplicate copies do cause

When more than one copy of `@asteasolutions/zod-to-openapi` is installed, each copy
keeps its own metadata registry. A schema built against one copy and rendered by an
`OpenAPIHono` that uses another loses the metadata it got from `.openapi()` (`title`,
`description`, `example`); descriptions set with `.describe()` are kept. Nothing
throws. In a pnpm monorepo where packages pin different `zod` versions, this happened
to this module's schemas on 0.6.1, 0.7.0 and 0.12.3 alike, and also to a control
schema built in the same package without this module, while the app's own schemas
kept their metadata. With one `zod` and two `@hono/zod-openapi` versions, the outcome
depended on import order. It is a property of which copy a schema is built against,
not of this module. The README now tells users to keep one copy.

### Effect on this ADR

- The Consequences bullet "The bug is fixed at the root" is not supported.
- The Negative bullet stating that sharing a registry across bundles "is what caused
  the original bug" is not supported either; split registries cause missing
  metadata, not the thrown error.
- The factory stays. It is harmless, its lazy-evaluation test still describes real
  behavior, and reverting to a const export would be another breaking change.
