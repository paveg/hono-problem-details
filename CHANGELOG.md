# hono-problem-details

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
