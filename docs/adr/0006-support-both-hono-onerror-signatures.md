# ADR-0006: Support both Hono onError signatures in one handler

## Status

Accepted

## Context

Hono 4 calls `app.onError` handlers as `(error, c)`. Hono 5 (observed with 5.0.0-rc.1) registers
them as error middleware: it calls them as `(c, next)` and places the error on `c.error`. Under
Hono 5 the previous handler received the context as `error` and `next` as `c`, threw
`TypeError: c.set is not a function`, and Hono answered with its default `500 text/plain`
(issue #226).

The compiler does not catch this. The handler's return type is Hono's `ErrorHandler`, which Hono 5
redefines as `H<E>`, so `app.onError(problemDetailsHandler())` type-checks under both majors.

The `hono` peer range is `>=4.13.7`. It has no upper bound, so 5.0.0 falls inside it once released,
while prereleases such as 5.0.0-rc.1 do not. The handler must therefore work for both majors from
one published build.

Three questions needed an answer:

1. **Dual signature or a Hono 5 only release**: a release that requires Hono 5 would drop Hono 4
   users, who are still on the `latest` dist-tag
2. **How to tell the two call forms apart**: `first instanceof Context`, a property check on
   `first`, or `typeof second === "function"`
3. **What to do when called as `(c, next)` with no `c.error`**: treat it as an unknown 500, or defer
   to `next()`

## Decision

`problemDetailsHandler` keeps its logic in an inner `handle(error, c)` and returns a small dispatcher
that accepts both call forms:

```ts
const dispatch = (first: Error | Context, second: Context | Next) => {
	if (typeof second !== "function") return handle(first as Error, second);
	const c = first as Context;
	return c.error ? handle(c.error, c) : second();
};
return dispatch as unknown as ErrorHandler;
```

**Detect on `typeof second === "function"`.** Only Hono 5's `next` is a function in that position.
The check imports no runtime value from `hono`, and it does not depend on class identity, which is
not reliable when a bundle contains more than one copy of a package (issue #133 shows a bundle
ending up with two zod instances). It also says nothing about `first`, so it holds for whatever a
Hono 4 caller passes as the error.

**Defer to `next()` when `c.error` is unset.** There is no error to report, so a problem response
would be invented. Hono 5's `ErrorHandler` type is also a middleware type, so
`app.use(problemDetailsHandler())` compiles there; deferring lets requests through instead of
failing every one of them. The branch can also run during a real error dispatch, if an earlier error
middleware clears `c.error`. Hono 5.0.0-rc.1's fallback then throws on the undefined error and answers
`500 text/plain`, the same result as with no handler registered. Clearing `c.error` is read as a
request to treat the error as gone, so no problem response is invented here either.

**Keep `ErrorHandler` as the public return type, with a cast.** The published declaration names
Hono's type, so it resolves against the consumer's installed major. Assertions such as
`const handler: ErrorHandler = problemDetailsHandler()` stay valid on both.

## Consequences

**Positive**:

- One build serves both majors, with no change to the public type and no new option
- `delegateToHandler` validator hooks work under Hono 5 too, because they throw into the same handler

**Negative**:

- Misusing the handler as ordinary middleware no longer fails loudly. Requests pass through, and
  thrown errors get Hono's default response instead of a problem response
- A test double for `c` that is itself callable takes the Hono 5 branch when the handler is called
  directly

- The cast means the compiler no longer checks the dispatcher against Hono's `ErrorHandler`. A future
  change to Hono's call form would be caught only by a test that runs on that version
- The dev dependency stays on Hono 4, where tests reach the `(c, next)` form by calling the handler
  directly. Those tests cannot show that Hono 5 itself dispatches this way, so the `hono-5` CI job
  reruns the suite on Hono 5, pinned to a release candidate until GA
- The Hono 4 branch becomes dead code once support for Hono 4 is dropped, and should be removed then

**Behavior that differs by major and is not normalized**:

- A thrown non-Error value makes `app.request()` reject under Hono 4. Hono 5 wraps it in an `Error`
  before dispatch, so the client receives a 500 problem response
- With several `onError` registrations, the last one wins under Hono 4. Under Hono 5 the first one
  that returns a response wins, so handlers registered after this one do not run
- An error thrown out of a user `onError` handler makes `app.request()` reject under Hono 4. Hono 5
  calls the handler once and answers from its built-in error handler. The swallow policy of ADR-0003
  and ADR-0005 still applies: it decides between a problem response and `text/plain`
