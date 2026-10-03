# ADR-0005: Swallow exceptions from the mapError callback

## Status

Accepted

## Context

The `problemDetailsHandler` accepts a `mapError(error)` callback that translates any
thrown error to a `ProblemDetailsInput` before the handler decides whether to use an
`HTTPException` or return a generic 500. The callback is user-provided code running
inside `app.onError`, and it can throw.

Three options exist for handling a thrown `mapError` callback:

1. **Propagate the throw** — let the `onError` handler fail, causing the error to escape
   up the Hono stack (through `#handleError`, `#dispatch`, `Hono.fetch`) and reject
   `app.request()`, breaking the HTTP contract
2. **Return a 500 directly** — abandon the original error and return an internal
   server error response
3. **Fall back to the un-mapped error** — ignore the callback failure and continue with
   the original error, treating it as if `mapError` returned undefined

Option 1 is dangerous: if `mapError` throws, the error escapes `app.onError` entirely
and the request promise rejects (observed in H55/H56 before the fix: the thrown error
propagated through Hono's error dispatch chain and the test's `await app.request()`
rejected instead of returning a Response). The client receives no response body.

Option 2 loses the original error context. An error the mapping function was supposed
to handle becomes a generic 500, erasing the client-relevant information.

Option 3 preserves the original error, sacrifices only the custom mapping, and ensures
the handler always returns a response — matching the existing pattern for `localize`.

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

- The HTTP contract is preserved: `app.onError` always returns a Response, never rejects
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
