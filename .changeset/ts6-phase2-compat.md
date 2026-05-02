---
"hono-problem-details": patch
---

Verify TypeScript 6.0 consumer compatibility in CI

The CI `type-compat` matrix now also runs against TypeScript 6.0.3, in addition to 5.0.4 / 5.4.5 / 5.7.3 / 5.9.3. Dev TypeScript was also bumped to 6.0.3, paired with `"ignoreDeprecations": "6.0"` in `tsconfig.json` to silence the `TS5101` triggered by `tsup`'s injected `baseUrl` in DTS bundling (see [tsup#1388](https://github.com/egoist/tsup/issues/1388)). The published `.d.ts` shape is unchanged; this PR only widens the verified consumer matrix.

The compat consumer (`tests/type-compat/core-consumer.ts`) was extended to import every published subpath (`./zod`, `./valibot`, `./openapi`, `./standard-schema`) so future TS bumps are guarded across the whole public surface, not just the core entry point.
