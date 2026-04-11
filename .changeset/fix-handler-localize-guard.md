---
"hono-problem-details": patch
---

Guard `problemDetailsHandler`'s `localize` callback against throws. A localize
function that threw would previously bubble out of the error handler and
re-enter Hono's `onError`, risking recursion. The handler now catches throws
and falls back to the un-localized problem details.
