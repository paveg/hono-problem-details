---
"hono-problem-details": minor
---

Properly declare optional peer dependencies for all schema validator integrations.

The previous `package.json` listed schema validators in `peerDependenciesMeta`
only, with no corresponding entries in `peerDependencies`. Per npm/pnpm/yarn
semantics, `peerDependenciesMeta` provides metadata for entries in
`peerDependencies` — without that anchor, the meta entries were dangling no-ops
and users got no peer warnings for missing or incompatible installs of the
schema validators they actually use.

This release adds proper peer constraints (kept optional via the existing
`peerDependenciesMeta`) for all seven schema validator integrations:

- `zod` `^3.25.0` (matches `@hono/zod-validator@0.7.0+` peer requirement)
- `valibot` `^1.0.0`
- `@hono/zod-validator` `^0.7.5` (the version where hook return values are
  correctly propagated to `zValidator`'s response)
- `@hono/valibot-validator` `^0.6.0` (the version where the `Response` type
  returned by hooks is properly respected)
- `@hono/zod-openapi` `^0.19.0`
- `@hono/standard-validator` `^0.2.0`
- `@standard-schema/spec` `^1.0.0`

Each peer remains optional, so consumers only see warnings for the integrations
they actually install. Users on incompatible versions (e.g. `zod@3.20`,
`@hono/zod-validator@0.5.x`) will now see peer dependency warnings from their
package manager — update the relevant package to satisfy the constraint above.
