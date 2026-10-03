---
"hono-problem-details": patch
---

Wrap `mapError` callback in try/catch to prevent handler re-entry when the callback throws. The behavior now mirrors `localize` (ADR-0003): a throwing `mapError` is swallowed and the error falls through to the standard `HTTPException` or generic-500 handling (#208).
