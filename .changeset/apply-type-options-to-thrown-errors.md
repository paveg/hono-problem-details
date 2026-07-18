---
"hono-problem-details": minor
---

`typePrefix` and `defaultType` now apply to errors thrown via `problemDetails()` / registry `create()` and to `mapError` results when no explicit `type` was set. Previously these handler options only affected `HTTPException` and unhandled errors, silently leaving `about:blank` on the library's primary API. An explicitly set `type` (including an explicit `"about:blank"`) is never overridden.
