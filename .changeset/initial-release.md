---
"hono-problem-details": minor
---

Initial release of hono-problem-details

- RFC 9457 Problem Details middleware for Hono
- `problemDetailsHandler()` for `app.onError` with `localize` callback for i18n
- `problemDetails()` factory and `ProblemDetailsError` class
- `createProblemTypeRegistry()` for type-safe error creation
- Zod validator integration (`hono-problem-details/zod`)
- Valibot validator integration (`hono-problem-details/valibot`)
- OpenAPI integration (`hono-problem-details/openapi`)
- Standard Schema integration (`hono-problem-details/standard-schema`)
- 100% test coverage (105 tests)
