---
"hono-problem-details": patch
---

### Bug Fixes

- Fix `getResponse()` throwing `RangeError` for out-of-range HTTP status codes — now clamps to 500
- Fix handler allowing 1xx status codes (100-199) through to `Response` constructor — tightened range to 200-599
- Wrap `JSON.stringify` with safe fallback for non-serializable extensions (circular references, BigInt)
- Fix status 418 slug containing apostrophe (`i'm-a-teapot` → `im-a-teapot`)

### Internal

- Extract `sanitizeExtensions`, `PROBLEM_JSON_CONTENT_TYPE`, `clampHttpStatus`, and `safeStringify` to `src/utils.ts`, resolving circular dependency between `error.ts` and `handler.ts`
