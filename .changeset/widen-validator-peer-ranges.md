---
"hono-problem-details": patch
---

Widen the optional peer ranges for `@hono/zod-validator` (`^0.7.5 || ^0.8.0 || ^0.9.0`) and `@hono/standard-validator` (`^0.2.0 || ^0.3.0 || ^0.4.0`). With the old ranges, a plain `npm install` failed with `ERESOLVE` next to the current `@hono/zod-openapi` (which depends on `@hono/zod-validator@^0.9.1`) or the current `@hono/standard-validator@0.4.1`, so npm users needed `--legacy-peer-deps`. The test suite already runs against `@hono/zod-validator@0.9` and `@hono/standard-validator@0.4.1`.
