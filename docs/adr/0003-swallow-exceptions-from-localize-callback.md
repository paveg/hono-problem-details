# ADR-0003: Swallow exceptions from the localize callback

## Status

Accepted

## Context

The `problemDetailsHandler` accepts a `localize(pd, c)` callback that translates
`title` and `detail` based on the request context (typically `Accept-Language`). The
callback is user-provided code running inside `app.onError`, and it can throw.

Three options exist for handling a thrown `localize` callback:

1. **Propagate the throw** — let the `onError` handler fail, which hands the new error
   back to `onError` and then out of the app
2. **Return a 500 directly** — abandon the original problem details and return an internal
   server error
3. **Fall back to the un-localized ProblemDetails** — ignore the callback failure and continue

Option 1 is dangerous. Observed with hono 4.13.9 when a root app's `app.onError` throws
every time: with no middleware, `onError` runs once and `app.request()` rejects; with N
middlewares, Hono re-invokes `onError` with each new error (N + 2 calls in total, bounded,
not an infinite loop), duplicating side effects, and the request then rejects. The client
receives whatever the runtime adapter produces, not a Problem Details response. (This
paragraph originally claimed exactly one re-entry; corrected in #216.)

Option 2 loses the original error context. A 404 with a broken Japanese translation
becoming a 500 "Internal Server Error" erases the user-visible information that the
client actually needed.

Option 3 preserves the original error, sacrifices only the translation, and avoids
re-entry — but it silently hides localize bugs from operators.

## Decision

`src/handler.ts` wraps the `localize` call in a try/catch and falls back to the
un-localized `ProblemDetails` on any thrown error:

```ts
if (options.localize) {
  try {
    pd = { ...pd, ...options.localize(pd, c) };
  } catch {
    // Fall through with the un-localized pd. A throwing localize must not
    // escape onError: Hono re-invokes onError with the new error, then rejects (ADR-0003).
  }
}
```

The swallow is documented in the README's Localization section so users know the
fallback exists. Users who need to observe localize failures are directed to catch
errors inside their callback and report them explicitly (logging, Sentry, etc.).

## Consequences

**Positive**:

- A translation bug cannot re-invoke `app.onError` or make the request reject
- The original error shape — `status`, `type`, `title`, `detail` — is preserved even if
  translation fails
- No special machinery required: the callback contract is "return a translated
  `ProblemDetails`, or throw and get ignored"

**Negative**:

- Localize bugs are invisible to operators unless the user-provided callback reports
  them internally
- Users cannot opt out of the swallow — there's no option like
  `onLocalizeError: "throw" | "swallow"`. If a future use case emerges, it would need a
  new option
- The README note about the swallow is the only surface where this behavior is
  documented. Users who don't read the README may be confused when translations silently
  disappear
