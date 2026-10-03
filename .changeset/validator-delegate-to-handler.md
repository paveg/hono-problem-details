---
"hono-problem-details": minor
---

Add opt-in `delegateToHandler` to `zodProblemHook`, `valibotProblemHook`, and `standardSchemaProblemHook` (#209).

With `delegateToHandler: true` the hook throws a `ProblemDetailsError` (status 422, same `title`/`detail` defaults and sanitized `errors` extension) instead of returning a Response, so `problemDetailsHandler` produces the response and its `typePrefix`, `defaultType`, `localize`, `autoInstance`, and `otelApi` options apply to validation errors. Requires `app.onError(problemDetailsHandler())`. The default output is unchanged.
