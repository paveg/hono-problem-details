# hono-problem-details

[![npm version](https://img.shields.io/npm/v/hono-problem-details)](https://www.npmjs.com/package/hono-problem-details)
[![npm downloads](https://img.shields.io/npm/dw/hono-problem-details)](https://www.npmjs.com/package/hono-problem-details)
[![bundle size](https://img.shields.io/bundlephobia/minzip/hono-problem-details)](https://bundlephobia.com/package/hono-problem-details)
[![GitHub stars](https://img.shields.io/github/stars/paveg/hono-problem-details?style=flat)](https://github.com/paveg/hono-problem-details/stargazers)
[![CI](https://github.com/paveg/hono-problem-details/actions/workflows/ci.yml/badge.svg)](https://github.com/paveg/hono-problem-details/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/paveg/hono-problem-details?utm_source=oss&utm_medium=github&utm_campaign=paveg%2Fhono-problem-details&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)](https://coderabbit.ai)
[![Devin Wiki](https://img.shields.io/badge/Devin-Wiki-blue)](https://app.devin.ai/org/ryota-ikezawa/wiki/paveg/hono-problem-details)

[RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html) Problem Details middleware for [Hono](https://hono.dev).

Returns `application/problem+json` structured error responses with a single `app.onError` setup.

> If this saved you from hand-rolling RFC 9457 in yet another Hono project, please [⭐ star the repo](https://github.com/paveg/hono-problem-details) — it helps others discover it.

## Why hono-problem-details?

Without a contract, HTTP error bodies drift. Every Hono project ends up reinventing the same
scaffolding — and every client ends up parsing whatever shows up.

- **Inconsistent shapes** across routes: `{ message }`, `{ error }`, `{ code, reason }`, or raw text
- **Validation errors** from each schema library return a different format, so clients special-case each
- **OpenAPI drift**: docs describe one error shape, the server returns another
- **No standard for extensions**: adding `retryAfter` or `correlationId` means breaking your own contract

[RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html) defines one structure — `{ type, status, title,
detail, instance }` plus arbitrary extension members — and this middleware makes it the default for every
error in your Hono app: thrown `ProblemDetailsError`, `HTTPException`, validation failures, and unhandled
exceptions alike. One `app.onError()` line, one contract your clients, OpenAPI spec, and integration tests
can all agree on.

## Features

- **RFC 9457 compliant** — `type`, `status`, `title`, `detail`, `instance` + extension members (flattened per §3.1, standard fields always win)
- **Hono native** — `app.onError` handler with RFC-compliant defaults
- **Zod integration** — `@hono/zod-validator` hook for validation errors
- **Valibot integration** — `@hono/valibot-validator` hook for validation errors
- **OpenAPI integration** — `@hono/zod-openapi` schemas for API documentation
- **Standard Schema** — `@hono/standard-validator` hook (works with any schema library)
- **Type-safe** — full TypeScript support with inference
- **Zero runtime dependencies** — `hono` is the only required peer dependency; validator integrations are optional
- **Localization** — `localize` callback for title/detail translation
- **Edge-first** — works on Cloudflare Workers, Deno, Bun, and Node.js

## Install

```bash
npm install hono-problem-details
```

### Requirements

- Hono `>= 4.12.14` (peer dependency)
- TypeScript `>= 5.0` — the published `.d.ts` files are CI-tested against TS 5.0, 5.4, 5.7, 5.9, and 6.0. Older TS versions may work but are not verified.
- Node.js `>= 22` (Node 20 reached end-of-life in April 2026; v0.6.0 raised the floor)

## Quick Start

```ts
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { problemDetailsHandler } from "hono-problem-details";

const app = new Hono();

app.onError(problemDetailsHandler());

app.get("/not-found", (c) => {
  throw new HTTPException(404, { message: "Resource not found" });
});

// Response:
// HTTP/1.1 404 Not Found
// Content-Type: application/problem+json
// {
//   "type": "about:blank",
//   "status": 404,
//   "title": "Not Found",
//   "detail": "Resource not found"
// }
```

## Patterns

Common error shapes for day-to-day API work. Validation errors are covered separately by the
[Zod](#zod-validator-integration) / [Valibot](#valibot-validator-integration) / [Standard Schema](#standard-schema-integration)
hooks — this section is for errors you throw yourself.

```ts
import { problemDetails } from "hono-problem-details";
```

### Unauthorized — 401

```ts
throw problemDetails({
  status: 401,
  title: "Unauthorized",
  detail: "Missing or invalid credentials",
  type: "https://api.example.com/problems/unauthorized",
});
```

Clients key off `type` to trigger a re-auth flow — no need to parse `detail`.

### Forbidden — 403

```ts
throw problemDetails({
  status: 403,
  title: "Forbidden",
  detail: `User ${userId} cannot access resource ${resourceId}`,
  type: "https://api.example.com/problems/forbidden",
  extensions: { requiredRole: "admin" },
});
```

### Not Found — 404

```ts
throw problemDetails({
  status: 404,
  title: "Not Found",
  detail: `Order ${orderId} does not exist`,
  instance: `/orders/${orderId}`,
});
```

`instance` points at the specific occurrence — clients can use it as a key for retry logic
or deduplication.

> **Auto-fill shortcuts.** `title` is optional — when omitted, the standard HTTP reason phrase
> for `status` is used (`404` → `"Not Found"`). Similarly, `instance` can be populated from
> the request path automatically via `problemDetailsHandler({ autoInstance: true })`. Both
> shortcuts skip the boilerplate in the example above; explicit values always win.

### Conflict — 409

```ts
throw problemDetails({
  status: 409,
  title: "Order Conflict",
  detail: `Order ${orderId} already exists`,
  type: "https://api.example.com/problems/order-conflict",
  instance: `/orders/${orderId}`,
});
```

Domain conflicts should always carry a project-specific `type` URI. `about:blank` is fine for
generic 4xx/5xx but loses its value the moment a client needs to distinguish two conflicts.

### Too Many Requests — 429

```ts
throw problemDetails({
  status: 429,
  title: "Too Many Requests",
  detail: "Request quota exceeded",
  type: "https://api.example.com/problems/rate-limited",
  extensions: { retryAfter: 60, quota: 1000, remaining: 0 },
});
```

Rate-limit metadata goes in `extensions` — clients read it straight from the body instead
of juggling `Retry-After` headers.

## Unhandled Errors — 500

Anything thrown that isn't a `ProblemDetailsError` or `HTTPException` (and isn't matched by
`mapError`) becomes a generic 500. `detail` is **always** the constant string
`"An unexpected error occurred"` — never the raw `error.message` or stack — so UIs that
render `detail` verbatim cannot leak server internals.

```ts
app.get("/boom", () => {
  throw new Error("DB connection lost: ECONNREFUSED");
});

// HTTP/1.1 500 Internal Server Error
// Content-Type: application/problem+json
// {
//   "type": "about:blank",
//   "status": 500,
//   "title": "Internal Server Error",
//   "detail": "An unexpected error occurred"
// }
```

In development, set `includeStack: true` to surface the stack trace as a top-level `stack`
extension member. `detail` stays constant either way — read the stack from `body.stack`:

```ts
problemDetailsHandler({
  includeStack: process.env.NODE_ENV !== "production",
});

// HTTP/1.1 500 Internal Server Error
// {
//   "type": "about:blank",
//   "status": 500,
//   "title": "Internal Server Error",
//   "detail": "An unexpected error occurred",
//   "stack": "Error: DB connection lost: ECONNREFUSED\n    at ..."
// }
```

Keep `includeStack` off in production — stack traces should not leave the server even via
opt-in extension fields.

## Extension Members

Extension members are flattened to top level per RFC 9457:

```ts
throw problemDetails({
  status: 422,
  title: "Validation Error",
  extensions: {
    errors: [
      { field: "email", message: "must be a valid email" },
    ],
  },
});

// Response body:
// {
//   "type": "about:blank",
//   "status": 422,
//   "title": "Validation Error",
//   "errors": [{ "field": "email", "message": "must be a valid email" }]
// }
```

## Problem Type Registry

Pre-define your API's error types for type-safe error creation:

```ts
import { createProblemTypeRegistry } from "hono-problem-details";

const problems = createProblemTypeRegistry({
  ORDER_CONFLICT: {
    type: "https://api.example.com/problems/order-conflict",
    status: 409,
    title: "Order Conflict",
  },
  RATE_LIMITED: {
    type: "https://api.example.com/problems/rate-limited",
    status: 429,
    title: "Too Many Requests",
  },
});

// Type-safe error creation
app.post("/orders", (c) => {
  throw problems.create("ORDER_CONFLICT", {
    detail: `Order ${id} already exists`,
    instance: `/orders/${id}`,
  });
});

// With extensions
throw problems.create("RATE_LIMITED", {
  extensions: { retryAfter: 60 },
});
```

### When to use the registry vs `problemDetails()`

Reach for `createProblemTypeRegistry` when your API has a fixed set of domain errors and you
want one source of truth for `type` / `status` / `title`. It pays off the moment the same error
is thrown from more than one handler — renames and URI changes happen in one place.

Use `problemDetails()` directly for one-off errors, prototypes, or generic 4xx/5xx where
`about:blank` is the right `type`. RFC 9457 explicitly allows `about:blank` when the HTTP status
code alone is enough context — don't force a URI just to have one.

## Zod Validator Integration

```ts
import { zValidator } from "@hono/zod-validator";
import { zodProblemHook } from "hono-problem-details/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  age: z.number().positive(),
});

app.post("/users", zValidator("json", schema, zodProblemHook()), (c) => {
  const data = c.req.valid("json");
  // ...
});

// Validation error response:
// HTTP/1.1 422 Unprocessable Content
// Content-Type: application/problem+json
// {
//   "type": "about:blank",
//   "status": 422,
//   "title": "Validation Error",
//   "detail": "Request validation failed",
//   "errors": [{ "field": "email", "message": "Invalid email", "code": "invalid_string" }]
// }
```

## Valibot Validator Integration

```ts
import { vValidator } from "@hono/valibot-validator";
import { valibotProblemHook } from "hono-problem-details/valibot";
import * as v from "valibot";

const schema = v.object({
  email: v.pipe(v.string(), v.email()),
  age: v.pipe(v.number(), v.minValue(1)),
});

app.post("/users", vValidator("json", schema, valibotProblemHook()), (c) => {
  const data = c.req.valid("json");
  // ...
});
```

## Standard Schema Integration

Works with any [Standard Schema](https://standardschema.dev/) compatible library (Zod, Valibot, ArkType, etc.):

```ts
import { sValidator } from "@hono/standard-validator";
import { standardSchemaProblemHook } from "hono-problem-details/standard-schema";
import { z } from "zod"; // or valibot, arktype, etc.

const schema = z.object({
  email: z.string().email(),
});

app.post("/users", sValidator("json", schema, standardSchemaProblemHook()), (c) => {
  const data = c.req.valid("json");
  // ...
});
```

## OpenAPI Integration

> **Peer dependencies**: `./openapi` requires `@hono/zod-openapi@^1.0.0`, which in turn
> requires `zod@^4.0.0`. The base `./zod` integration (validator hook) works with both
> `zod@^3.25.0` and `zod@^4.0.0` — the version constraint above only applies when you import
> from `hono-problem-details/openapi`.

Use with `@hono/zod-openapi` to document Problem Details error responses in your OpenAPI spec:

```ts
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { problemDetailsHandler } from "hono-problem-details";
import {
  ProblemDetailsSchema,
  createProblemDetailsSchema,
  problemDetailsResponse,
} from "hono-problem-details/openapi";

const app = new OpenAPIHono();
app.onError(problemDetailsHandler());

// Use problemDetailsResponse() in route definitions
const route = createRoute({
  method: "get",
  path: "/users/{id}",
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ id: z.string(), name: z.string() }),
        },
      },
      description: "User found",
    },
    404: problemDetailsResponse(404),
    422: problemDetailsResponse(422, "Validation Error"),
  },
});

// With extension members
const errorWithExtensions = createProblemDetailsSchema(
  z.object({
    errors: z.array(z.object({ field: z.string(), message: z.string() })),
  }),
);
// Use: problemDetailsResponse(422, "Validation Error", errorWithExtensions)
```

## Localization

Use the `localize` callback to translate `title` and `detail` based on the request context.
Return a partial patch with just the fields you want to override — everything else falls
through unchanged. Returning nothing (or `undefined`) leaves the response untouched.

```ts
problemDetailsHandler({
  localize: (pd, c) => {
    const lang = c.req.header("Accept-Language");
    if (lang?.startsWith("ja")) {
      return { title: translate("ja", pd.title) };
    }
    return pd;
  },
});
```

The callback receives the fully-built `ProblemDetails` object and the Hono `Context`, allowing access to headers like `Accept-Language`. Return a new `ProblemDetails` with translated fields.

> **Note on caching**: If your responses vary by `Accept-Language`, add `Vary: Accept-Language`
> from your own middleware so CDNs and browser caches don't serve the wrong translation.
> This middleware intentionally does not set `Vary` — error handlers shouldn't mutate
> request-scope headers that also apply to successful responses.

> **Note on failures**: If your `localize` callback throws, the handler falls back to the
> un-localized `ProblemDetails` and continues. Throwing from inside `app.onError` would cause
> the error handler to re-enter itself, so the swallow is deliberate. Catch errors inside your
> callback if you need to observe them.

## Handler Options

```ts
problemDetailsHandler({
  // Prefix for type URI (e.g., "https://api.example.com/problems")
  typePrefix: "https://api.example.com/problems",

  // Default type URI (default: "about:blank")
  defaultType: "about:blank",

  // Include stack trace in `extensions.stack` on 500 responses (development only)
  includeStack: process.env.NODE_ENV === "development",

  // Populate `instance` from `c.req.path` when the thrown problem didn't specify one
  autoInstance: true,

  // Localize title/detail before sending the response.
  // Return a partial patch — fields you omit fall through from the original.
  localize: (pd, c) => {
    const lang = c.req.header("Accept-Language") ?? "en";
    return { title: `[${lang}] ${pd.title}` };
  },

  // Custom error mapping
  mapError: (error) => {
    if (error instanceof MyCustomError) {
      return {
        status: error.statusCode,
        title: error.name,
        detail: error.message,
      };
    }
    return undefined; // fallback to default handling
  },
});
```

## Used By

The following Hono middleware libraries use `hono-problem-details` as an optional dependency for RFC 9457 error responses:

- [hono-idempotency](https://github.com/paveg/hono-idempotency) — Idempotency key middleware for Hono
- [hono-webhook-verify](https://github.com/paveg/hono-webhook-verify) — Webhook signature verification middleware for Hono
- [hono-cf-access](https://github.com/paveg/hono-cf-access) — Country / ASN blocking and maintenance mode via Cloudflare Workers `request.cf`

## License

MIT
