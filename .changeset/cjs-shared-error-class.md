---
"hono-problem-details": patch
---

Fix the CommonJS build so a validator hook with `delegateToHandler: true` answers `422` instead of `500`. The CJS entry points for `.`, `/zod`, `/valibot`, and `/standard-schema` each carried their own copy of `ProblemDetailsError`, so `problemDetailsHandler` did not recognize errors thrown by the hooks. The CJS entry points now share one copy, as the ESM build already did.
