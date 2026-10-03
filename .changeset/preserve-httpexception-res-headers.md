---
"hono-problem-details": patch
---

The handler now copies headers from `HTTPException.res` onto the problem response, so headers such as `WWW-Authenticate` (set by `basicAuth` and `bearerAuth`) and `Retry-After` are no longer dropped. `Content-Type` and `Content-Length` are never copied, so the response stays `application/problem+json`, and multiple `Set-Cookie` values are preserved. An `HTTPException` without a message no longer produces an empty `detail`; the member is omitted instead.
