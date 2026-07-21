---
"hono-problem-details": minor
---

Add opt-in `autoCode` option to `createProblemTypeRegistry` that derives a `code` extension from each registry key (SCREAMING_SNAKE -> kebab-case). An explicit `code` on the registry definition, or `extensions.code` passed to `.create()`, overrides the derived value.
