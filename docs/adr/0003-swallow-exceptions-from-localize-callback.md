# ADR-0003: Swallow exceptions from the localize callback

## Status

Accepted

## Context

The `problemDetailsHandler` accepts a `localize(pd, c)` callback that translates
`title` and `detail` based on the request context (typically `Accept-Language`). The
callback is user-provided code running inside `app.onError`, and it can throw.

Three options exist for handling a thrown `localize` callback:

1. **Propagate the throw** — let the `onError` handler fail, which causes Hono to re-enter
   `onError` with the new error, potentially looping
2. **Return a 500 directly** — abandon the original problem details and return an internal
   server error
3. **Fall back to the un-localized ProblemDetails** — ignore the callback failure and continue

Option 1 is dangerous: when `app.onError` itself throws an `Error`, Hono re-invokes the
error handler exactly once more (a single bounded re-entry — not an infinite loop),
duplicating side effects and typically ending in an unhelpful "error in error handler"
response.
This is a well-known footgun for Node.js and Hono error middleware.

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
    // cause the error handler itself to throw — that would re-enter onError.
  }
}
```

The swallow is documented in the README's Localization section so users know the
fallback exists. Users who need to observe localize failures are directed to catch
errors inside their callback and report them explicitly (logging, Sentry, etc.).

## Consequences

**Positive**:

- `app.onError` cannot re-enter itself because of a translation bug
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
