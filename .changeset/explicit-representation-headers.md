---
"hono-problem-details": patch
---

`problemDetailsHandler` now filters `HTTPException.res` headers with an explicit list instead of the `content-` prefix. `Content-Security-Policy` and `Content-Security-Policy-Report-Only` are no longer dropped, and other `Content-*` headers outside the list are now kept. `Repr-Digest` is now removed along with the other representation headers.
