# hono-problem-details

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
