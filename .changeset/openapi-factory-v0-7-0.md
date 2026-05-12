---
"hono-problem-details": minor
---

**Breaking** (pre-1.0 minor): `./openapi` integration — `ProblemDetailsSchema` const export is removed and replaced with `getProblemDetailsSchema()`, a memoized factory.

This fixes [#133](https://github.com/paveg/hono-problem-details/issues/133): `TypeError: e.string(...).openapi is not a function` thrown at module load time under bundlers that resolve duplicate `zod` instances (Cloudflare Workers via `wrangler deploy`/esbuild, pnpm strict hoisting, npm peer-mismatch). The previous implementation built the schema at module top level, executing `.openapi(...)` before the consumer's bundle had finished resolving and patching `zod`. The factory defers construction past module load, so `.openapi(...)` only runs after the patch is reachable. See [ADR-0004](./docs/adr/0004-defer-openapi-schema-construction-via-factory.md) for the design rationale, including why Proxy- and Hybrid-based repairs were rejected.

Migration:

```ts
// before (v0.6.x)
import { ProblemDetailsSchema } from "hono-problem-details/openapi";

// after (v0.7.0)
import { getProblemDetailsSchema } from "hono-problem-details/openapi";
const ProblemDetailsSchema = getProblemDetailsSchema();
```

`createProblemDetailsSchema` and `problemDetailsResponse` keep their public signatures — no migration needed for those.
