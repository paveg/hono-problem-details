---
"hono-problem-details": minor
---

Fix the type of `zodProblemHook()` so it can be passed to `zValidator` with zod 4 under a strict type check ([#245](https://github.com/paveg/hono-problem-details/issues/245)). With zod 4, `@hono/zod-validator` passes the core `$ZodError`, which was not assignable to the hook's `ZodError` parameter (`TS2769`). The hook now types the error by the fields it reads (`issues` with `path`, `message`, and an optional `code`), so zod 3.25 and zod 4 both type-check, including the `zod/v4` entry on early 3.25.x releases. Runtime behavior is unchanged.

Type-level note: code that extracts the hook's parameter type (for example, `Parameters<ReturnType<typeof zodProblemHook>>[0]`) and treats its `error` as zod's `ZodError` no longer compiles. Annotate such code with zod's own types instead. Passing the hook to `zValidator`, calling it directly, and assigning it to a variable typed with the old signature still compile.
