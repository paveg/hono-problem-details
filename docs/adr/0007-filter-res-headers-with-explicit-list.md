# ADR-0007: Filter HTTPException.res headers with an explicit list

## Status

Accepted

## Context

`problemDetailsHandler` copies headers from `HTTPException.res` onto the problem response, so that
values such as `WWW-Authenticate` from `basicAuth` survive. Headers that describe the original body
must stay behind, because the problem JSON replaces that body.

The filter excluded every name starting with `content-`, plus a short list. HTTP header names are not
a namespace, so the prefix was wrong in both directions: it dropped `Content-Security-Policy`, which
says nothing about the body, and it let `Repr-Digest` through, which does.

While looking at this, issue #229 raised a related problem. When a middleware throws after
`await next()`, Hono's `c.res` setter copies the headers of the discarded response onto whatever
`onError` returns, so a problem response behind `compress()` can carry `Content-Encoding: gzip` on an
uncompressed body.

## Decision

**Replace the prefix with an explicit list.** It follows the specifications:

| Headers | Source |
| --- | --- |
| `Content-Type`, `-Encoding`, `-Language`, `-Length`, `-Location` | RFC 9110 §8.3–8.7 |
| `ETag`, `Last-Modified` | RFC 9110 §8.8 |
| `Content-Range` | RFC 9110 §14.4 |
| `Accept-Ranges` | RFC 9110 §14.3; kept from the earlier list |
| `Content-Digest`, `Repr-Digest`, `Digest` | RFC 9530 |
| `Content-Disposition` | RFC 6266 |
| `Transfer-Encoding` | RFC 9112 §6.1 |
| `Content-MD5` | Obsoleted (RFC 9110 §18.4); stays excluded, as the prefix already excluded it |

An unknown `Content-*` header now stays. Keeping a header that should have gone is less harmful than
silently removing a security header, and a new representation header can be added to the list.

**Leave the headers of a discarded `c.res` to Hono.** The same bleed happens with a plain `onError`
handler that returns `c.json()` and no library involved, on Hono 4.13.13 and 5.0.0-rc.1, so it is
framework behavior and not a defect in this handler. Working around it was tried and rejected:

- The handler cannot change it on the response it returns, so it has to rebuild `c.res` and reset
  `c.finalized`. Deleting from `c.res` instead fails on immutable `fetch()` responses, always on
  Hono 4 and on Hono 5 once the body is consumed. Leaving `c.finalized` set makes Hono 5 discard the
  problem response and answer an empty `200`
- Reading `c.res` creates a response from headers queued by `c.header()`, so they would newly reach
  error responses, `Set-Cookie` included
- Removing `Cache-Control` as part of it would also remove `no-store`, leaving a 404 storable by a
  cache where the bleed had kept it unstorable

## Consequences

**Positive**:

- Security headers on `HTTPException.res` reach the client
- The handler touches only the headers it copies itself, and relies on no Hono internals

**Negative**:

- A throw after `await next()` can still send `Content-Encoding` on an uncompressed problem body until
  Hono changes this. The README documents the case, and issue #229 tracks it
- `Content-Range` stays excluded on a 416, where RFC 9110 §14.4 gives it a meaning. This filter excluded
  it before this change as well
- A new representation header in a future specification stays on the response until it is added to the
  list
