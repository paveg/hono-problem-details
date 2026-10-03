---
"hono-problem-details": patch
---

A throwing `mapError` no longer escapes the error handler. Previously the error propagated out of `app.onError` and the request rejected instead of returning a Problem Details response. The callback is now wrapped in try/catch like `localize` (ADR-0003, ADR-0005): a throwing `mapError` is ignored and the original error falls through to the standard `HTTPException` or generic-500 handling ([#208](https://github.com/paveg/hono-problem-details/issues/208)).
