---
"hono-problem-details": minor
---

Add `onUnhandledError` handler option so errors that fall through to the generic 500 response can be logged or reported (#207).

`problemDetailsHandler()` replaces Hono's default error handler, which `console.error`s, and previously logged nothing. The callback `(error, c) => void` runs only for the generic 500 path (not for `ProblemDetailsError`, `HTTPException`, or errors matched by `mapError`), before the response is built. A throwing callback is swallowed (ADR-0003), and its return value is not awaited. Default behavior is unchanged when the option is absent.
