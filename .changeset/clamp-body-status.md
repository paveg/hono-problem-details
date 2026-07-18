---
"hono-problem-details": patch
---

The JSON body's `status` field is now clamped to the same 200-599 range as the HTTP response status. Previously `problemDetails({ status: 9999 })` produced an HTTP 500 response whose body still said `"status": 9999`, contradicting RFC 9457's expectation that the body `status` mirrors the response status.
