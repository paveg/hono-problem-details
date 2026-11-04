---
"hono-problem-details": patch
---

`problemDetailsHandler` now works under Hono 5, which calls `onError` as `(c, next)` with the error on `c.error`. Previously every failing request answered `500 text/plain`, and `onUnhandledError` received the context instead of the error. Responses from `app.onError(problemDetailsHandler())` under Hono 4 are unchanged.
