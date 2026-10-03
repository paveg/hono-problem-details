# ADR-0005: Swallow exceptions from the mapError callback

## Status

Accepted

## Context

The `problemDetailsHandler` accepts a `mapError(error)` callback that translates any
thrown error to a `ProblemDetailsInput` before the handler decides whether to use an
`HTTPException` or return a generic 500. The callback is user-provided code running
inside `app.onError`, and it can throw.

Three options exist for handling a thrown `mapError` callback:

1. **Propagate the throw** — let the `onError` handler fail, which causes Hono to re-enter
   `onError` with the new error, potentially looping
2. **Return a 500 directly** — abandon the original error and return an internal
   server error response
3. **Fall back to the un-mapped error** — ignore the callback failure and continue with
   the original error, treating it as if `mapError` returned undefined

Option 1 is dangerous: when `app.onError` itself throws an `Error`, Hono re-invokes the
error handler exactly once more (a single bounded re-entry — not an infinite loop),
duplicating side effects and typically ending in an unhelpful "error in error handler"
response. This is a well-known footgun for Node.js and Hono error middleware.

Option 2 loses the original error context. An error mapped to a 404 with a broken
mapping function becoming a 500 "Internal Server Error" erases the error information
that the client needed.

Option 3 preserves the original error, sacrifices only the custom mapping, and avoids
re-entry — matching the existing pattern for `localize`.

## Decision

`src/handler.ts` wraps the `mapError` call in a try/catch and falls back to treating
it as if `mapError` returned undefined (proceeding to `HTTPException` or the generic 500
handler) on any thrown error:

```ts
if (options.mapError) {
  try {
    const mapped = options.mapError(error);
    if (mapped) {
      return toResponse(mapped, c, options);
    }
  } catch {
    // Fall through as if mapError returned undefined. A throwing mapError must not
    // cause the error handler itself to throw — that would re-enter onError.
  }
}
```

This applies the same swallow policy to `mapError` as ADR-0003 applies to `localize`.
Users who need to observe `mapError` failures are directed to catch errors inside their
callback and report them explicitly (logging, Sentry, etc.).

## Consequences

**Positive**:

- `app.onError` cannot re-enter itself because of a mapping callback bug
- The original error handling logic — `HTTPException` checks, the generic 500 — still
  runs even if the mapping callback fails
- Consistent with the `localize` callback swallow pattern (ADR-0003)
- No special machinery required: the callback contract is "return a mapped
  `ProblemDetailsInput`, or throw and get ignored"

**Negative**:

- `mapError` bugs are invisible to operators unless the user-provided callback reports
  them internally
- Users cannot opt out of the swallow — there's no option like
  `onMapErrorError: "throw" | "swallow"`. If a future use case emerges, it would need a
  new option
- The documentation of this behavior is a non-normative note in the README or JSDoc.
  Users who don't read it may be confused when custom mappings silently disappear
