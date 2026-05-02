# hono-problem-details

## 0.6.1

### Patch Changes

- [#126](https://github.com/paveg/hono-problem-details/pull/126) [`86e4a74`](https://github.com/paveg/hono-problem-details/commit/86e4a74e0248e69eb6245ce1084b09ce6ffa56ad) Thanks [@paveg](https://github.com/paveg)! - Verify TypeScript 6.0 consumer compatibility in CI

  The CI `type-compat` matrix now also runs against TypeScript 6.0.3, in addition to 5.0.4 / 5.4.5 / 5.7.3 / 5.9.3. Dev TypeScript was also bumped to 6.0.3, paired with `"ignoreDeprecations": "6.0"` in `tsconfig.json` to silence the `TS5101` triggered by `tsup`'s injected `baseUrl` in DTS bundling (see [tsup#1388](https://github.com/egoist/tsup/issues/1388)). The published `.d.ts` shape is unchanged; this PR only widens the verified consumer matrix.

  The compat consumer (`tests/type-compat/core-consumer.ts`) was extended to import every published subpath (`./zod`, `./valibot`, `./openapi`, `./standard-schema`) so future TS bumps are guarded across the whole public surface, not just the core entry point.

## 0.6.0

### Minor Changes

- [#122](https://github.com/paveg/hono-problem-details/pull/122) [`d3a3f38`](https://github.com/paveg/hono-problem-details/commit/d3a3f383ba640075bc4b0ca0d6809a68714e63df) Thanks [@paveg](https://github.com/paveg)! - Drop Node.js 20 support; minimum is now Node 22.

  Node 20 reached end-of-life in April 2026 (https://nodejs.org/en/about/previous-releases). The `engines.node` floor has been raised to `>=22`, and the CI matrix now tests against Node 22 and 24 only.

  If you are still on Node 20, pin `hono-problem-details` to `<0.6.0` until you can upgrade. The runtime API is unchanged.

## 0.5.0

### Minor Changes

- [#113](https://github.com/paveg/hono-problem-details/pull/113) [`9b69052`](https://github.com/paveg/hono-problem-details/commit/9b69052038a42acfce167faac85e92bfca9e9c51) Thanks [@paveg](https://github.com/paveg)! - Support Zod v4 and bump `@hono/zod-openapi` to v1

  - `zod` peer dependency range widened from `^3.25.0` to `^3.25.0 || ^4.0.0`. The `./zod` integration works unchanged because it only touches `ZodError.issues` and `issue.path/message/code`, which are compatible across v3 and v4.
  - `@hono/zod-openapi` peer dependency bumped from `^0.19.0` to `^1.0.0`. Consumers using `./openapi` must upgrade to `@hono/zod-openapi@^1` (which requires `zod@^4`).
  - `./openapi` internal rewrite: `.merge()` → `.extend()` and `z.AnyZodObject` → `z.ZodObject` to match Zod v4 API. `createProblemDetailsSchema` now returns `z.ZodObject` (previously `z.AnyZodObject`). `problemDetailsResponse` now accepts `z.ZodType` (previously `z.ZodTypeAny`).

  CI is now exercised against Zod v4 and `@hono/zod-openapi` v1 at dev-dependency level, so v4 compatibility is verified end-to-end rather than only declared.

## 0.4.0

### Minor Changes

- [`d3d62a3`](https://github.com/paveg/hono-problem-details/commit/d3d62a39a816782b9ef38d83d7f98ecedbce196c) Thanks [@paveg](https://github.com/paveg)! - Move `includeStack` output to `extensions.stack`; always set a user-safe `detail` on 500 responses.

  **Behaviour change** on unhandled `Error` → 500 responses from `problemDetailsHandler`:

  - `detail` is now **always** `"An unexpected error occurred"` (a generic, UI-safe string).
    Previously, the raw `error.stack` was written into `detail` when `includeStack: true`.
  - When `includeStack: true`, the stack trace is emitted as a top-level `stack` extension
    member per RFC 9457 §3.1 flattening. Consumers that want it read `body.stack`; clients
    that only render `detail` now receive a safe, constant message.
  - When `includeStack: false` (default), the 500 body contains `detail` and nothing else
    — no stack, no leaked error message.

  **Why**: RFC 9457 calls `detail` a "human-readable explanation specific to this
  occurrence". Many clients (dashboards, error pages, toast UIs, log sinks) render it
  verbatim, so leaking a server stack trace via `detail` turns a dev-only flag into a
  production foot-gun. `extensions` fields are, by convention, inspected only by consumers
  that opt in, so the stack is gated behind explicit client intent.

  **Migration**:

  - Consumers of 500 bodies should read `body.stack` instead of `body.detail` when
    `includeStack` is on.
  - `includeStack` should remain disabled in production. A common safe pattern:

    ```ts
    problemDetailsHandler({
      includeStack: process.env.NODE_ENV !== "production",
    });
    ```

## 0.3.0

### Minor Changes

- [`d7f2dda`](https://github.com/paveg/hono-problem-details/commit/d7f2dda059e1911d5c2fc000d233f7bcbc0b567a) Thanks [@paveg](https://github.com/paveg)! - Add `autoInstance` handler option and widen `localize` return type to accept partial patches.

  - **`problemDetailsHandler({ autoInstance: true })`** populates `instance` from `c.req.path`
    when the thrown problem did not specify one. Opt-in to avoid silently changing response
    shape for existing consumers; explicit `instance` values always win.
  - **`localize` callback** may now return `Partial<ProblemDetails> | undefined` instead of
    the full object. This aligns the TypeScript type with the existing runtime behaviour
    (`{ ...pd, ...localize(pd, c) }`). Returning the full object still works; existing
    callbacks compile unchanged.
  - README: documents the `title`-from-status auto-fill (unchanged runtime behaviour) and the
    new `autoInstance` shortcut so callers stop hand-writing `title`/`instance` for stock
    HTTP semantics.

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
