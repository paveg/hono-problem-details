---
"hono-problem-details": patch
---

Fix the CommonJS build so a validator hook with `delegateToHandler: true` answers `422` instead of `500`. Each CJS entry point carried its own copy of `ProblemDetailsError`, so `problemDetailsHandler` from `hono-problem-details` did not recognize errors thrown by `hono-problem-details/zod`, `/valibot`, or `/standard-schema`. The CJS entry points now share one copy, as the ESM build already did.
