---
"hono-problem-details": minor
---

Support Zod v4 and bump `@hono/zod-openapi` to v1

- `zod` peer dependency range widened from `^3.25.0` to `^3.25.0 || ^4.0.0`. The `./zod` integration works unchanged because it only touches `ZodError.issues` and `issue.path/message/code`, which are compatible across v3 and v4.
- `@hono/zod-openapi` peer dependency bumped from `^0.19.0` to `^1.0.0`. Consumers using `./openapi` must upgrade to `@hono/zod-openapi@^1` (which requires `zod@^4`).
- `./openapi` internal rewrite: `.merge()` → `.extend()` and `z.AnyZodObject` → `z.ZodObject` to match Zod v4 API. `createProblemDetailsSchema` now returns `z.ZodObject` (previously `z.AnyZodObject`). `problemDetailsResponse` now accepts `z.ZodType` (previously `z.ZodTypeAny`).

CI is now exercised against Zod v4 and `@hono/zod-openapi` v1 at dev-dependency level, so v4 compatibility is verified end-to-end rather than only declared.
