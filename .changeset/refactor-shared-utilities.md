---
"hono-problem-details": patch
---

refactor: extract shared utilities and simplify integrations

- Extract `normalizeProblemDetails` and `buildProblemResponse` to `utils.ts` eliminating duplication
- Create shared `validation.ts` with `buildValidationResponse` for integration hooks
- Simplify registry `create` with spread operator
- Add 46 new boundary value and edge case tests (131 → 177)
