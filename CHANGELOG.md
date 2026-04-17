# hono-problem-details

## 0.2.1

### Patch Changes

- [#100](https://github.com/paveg/hono-problem-details/pull/100) [`4ff3d92`](https://github.com/paveg/hono-problem-details/commit/4ff3d92a6d5d2214da7d30d1613300bb1f0548ed) Thanks [@paveg](https://github.com/paveg)! - Raise `hono` peer-dependency floor from `>=4.0.0` to `>=4.12.14`.

  `hono@<4.12.14` is affected by an HTML-injection advisory in `hono/jsx` SSR (Dependabot alert [#23](https://github.com/paveg/hono-problem-details/issues/23), [GHSA](https://github.com/honojs/hono/security/advisories)). This library does not use `hono/jsx` and is not itself vulnerable, but the floor bump nudges consumers onto a patched `hono` so downstream apps that do use JSX SSR are not left on an unsafe version via transitive install resolution.

  Consumers pinned to `hono@<4.12.14` will see a peer-dep warning (pnpm/yarn) or resolution error (npm `--strict-peer-deps`). Upgrade `hono` to `^4.12.14` or later.

## 0.2.0

### Minor Changes

- [#87](https://github.com/paveg/hono-problem-details/pull/87) [`f250fb8`](https://github.com/paveg/hono-problem-details/commit/f250fb869be12c026507043626d0a4e8aeab12ec) Thanks [@paveg](https://github.com/paveg)! - Properly declare optional peer dependencies for all schema validator integrations.

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

## 0.1.8

### Patch Changes

- [#77](https://github.com/paveg/hono-problem-details/pull/77) [`7d985ca`](https://github.com/paveg/hono-problem-details/commit/7d985ca9f354eef5266cd98504ada4e11c636fda) Thanks [@paveg](https://github.com/paveg)! - Guard `problemDetailsHandler`'s `localize` callback against throws. A localize
  function that threw would previously bubble out of the error handler and
  re-enter Hono's `onError`, risking recursion. The handler now catches throws
  and falls back to the un-localized problem details.

- [#78](https://github.com/paveg/hono-problem-details/pull/78) [`8ec3f44`](https://github.com/paveg/hono-problem-details/commit/8ec3f44b0602d01d089b253a63cfe08d757543cc) Thanks [@paveg](https://github.com/paveg)! - `clampHttpStatus` now requires an integer via `Number.isInteger`. Previously
  strings, floats, and BigInts could slip through the 200–599 range check via
  JavaScript type coercion, producing undefined behavior in stricter fetch
  runtimes. Non-integer or out-of-range values now fall back to 500.

- [#79](https://github.com/paveg/hono-problem-details/pull/79) [`81300f5`](https://github.com/paveg/hono-problem-details/commit/81300f5007987d9d335f10218ef39f6b28a9fa4f) Thanks [@paveg](https://github.com/paveg)! - Validator hooks (`zod`, `valibot`, `standard-schema`) now strip C0 control
  characters (`\x00`–`\x1f`) and DEL (`\x7f`) from `field` and `message` in the
  `errors[]` array before serialization. This prevents log-line spoofing via
  BEL / backspace / similar controls embedded in user-supplied field names.
  Bidi/format controls (`U+202E` etc.) are intentionally left intact to avoid
  breaking legitimate i18n content.

## 0.1.7

### Patch Changes

- [#73](https://github.com/paveg/hono-problem-details/pull/73) [`5635dc1`](https://github.com/paveg/hono-problem-details/commit/5635dc1834083c12e80b8c4a8d7b60291a32d73a) Thanks [@paveg](https://github.com/paveg)! - Make `valibotProblemHook()` generic to match `@hono/valibot-validator` Hook type, removing the need for `as never` cast

## 0.1.6

### Patch Changes

- [`2daa7c6`](https://github.com/paveg/hono-problem-details/commit/2daa7c641ddd233a06c8b276d8e6699a3199a8a1) Thanks [@paveg](https://github.com/paveg)! - Add `typesVersions` field to support subpath imports with `moduleResolution: "node"`

## 0.1.5

### Patch Changes

- [`10bd8cc`](https://github.com/paveg/hono-problem-details/commit/10bd8cc0ad16007ccd0cc2ef2182ebce214b44dd) Thanks [@paveg](https://github.com/paveg)! - refactor: extract shared utilities and simplify integrations

  - Extract `normalizeProblemDetails` and `buildProblemResponse` to `utils.ts` eliminating duplication
  - Create shared `validation.ts` with `buildValidationResponse` for integration hooks
  - Simplify registry `create` with spread operator
  - Add 46 new boundary value and edge case tests (131 → 177)

## 0.1.4

### Patch Changes

- [#61](https://github.com/paveg/hono-problem-details/pull/61) [`41d1e21`](https://github.com/paveg/hono-problem-details/commit/41d1e21007e8c89681087383b2214170c9106bf7) Thanks [@paveg](https://github.com/paveg)! - ### Bug Fixes

  - Fix `getResponse()` throwing `RangeError` for out-of-range HTTP status codes — now clamps to 500
  - Fix handler allowing 1xx status codes (100-199) through to `Response` constructor — tightened range to 200-599
  - Wrap `JSON.stringify` with safe fallback for non-serializable extensions (circular references, BigInt)
  - Fix status 418 slug containing apostrophe (`i'm-a-teapot` → `im-a-teapot`)

  ### Internal

  - Extract `sanitizeExtensions`, `PROBLEM_JSON_CONTENT_TYPE`, `clampHttpStatus`, and `safeStringify` to `src/utils.ts`, resolving circular dependency between `error.ts` and `handler.ts`

## 0.1.3

### Patch Changes

- [#51](https://github.com/paveg/hono-problem-details/pull/51) [`327f984`](https://github.com/paveg/hono-problem-details/commit/327f984e7f7a7c1634df2234e32326d481f6b046) Thanks [@paveg](https://github.com/paveg)! - Fix Content-Type consistency in validation hooks, expand STATUS_PHRASES to all RFC 9110 codes, export PROBLEM_JSON_CONTENT_TYPE

## 0.1.2

### Patch Changes

- [`6210996`](https://github.com/paveg/hono-problem-details/commit/6210996225347c81384d10485ee0d2df85c21e7f) Thanks [@paveg](https://github.com/paveg)! - Security hardening: strip dangerous keys from extensions, add charset=utf-8 to Content-Type, validate HTTP status code range

## 0.1.1

### Patch Changes

- [`a905bdf`](https://github.com/paveg/hono-problem-details/commit/a905bdfba70d8ba0cd679d424c3355c91c1af5a6) Thanks [@paveg](https://github.com/paveg)! - Fix extension members overwriting standard RFC 9457 fields

  - Standard fields (type, status, title, detail, instance) now always take precedence over extension keys with the same name
  - Add 12 boundary tests for edge cases

## 0.1.0

### Minor Changes

- [#21](https://github.com/paveg/hono-problem-details/pull/21) [`6ff87ee`](https://github.com/paveg/hono-problem-details/commit/6ff87eeb97e9eac092c727b20984807adc56726d) Thanks [@paveg](https://github.com/paveg)! - Initial release of hono-problem-details

  - RFC 9457 Problem Details middleware for Hono
  - `problemDetailsHandler()` for `app.onError` with `localize` callback for i18n
  - `problemDetails()` factory and `ProblemDetailsError` class
  - `createProblemTypeRegistry()` for type-safe error creation
  - Zod validator integration (`hono-problem-details/zod`)
  - Valibot validator integration (`hono-problem-details/valibot`)
  - OpenAPI integration (`hono-problem-details/openapi`)
  - Standard Schema integration (`hono-problem-details/standard-schema`)
  - 100% test coverage (105 tests)
