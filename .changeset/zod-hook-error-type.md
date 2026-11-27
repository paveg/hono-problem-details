---
"hono-problem-details": patch
---

Fix the type of `zodProblemHook()` so it can be passed to `zValidator` with zod 4 under a strict type check ([#245](https://github.com/paveg/hono-problem-details/issues/245)). With zod 4, `@hono/zod-validator` passes the core `$ZodError`, which was not assignable to the hook's `ZodError` parameter (`TS2769`). The hook now types the error by the fields it reads (`issues` with `path`, `message`, `code`), so zod 3 and zod 4 both type-check. Runtime behavior is unchanged.
