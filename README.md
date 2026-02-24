# hono-problem-details

[RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html) Problem Details middleware for [Hono](https://hono.dev).

Returns `application/problem+json` structured error responses with a single `app.onError` setup.

## Features

- **RFC 9457 compliant** — standard 5 fields + extension members
- **Hono native** — `app.onError` handler + `createMiddleware()` patterns
- **Zod integration** — `@hono/zod-validator` hook for validation errors
- **Valibot integration** — `@hono/valibot-validator` hook for validation errors
- **OpenAPI integration** — `@hono/zod-openapi` schemas for API documentation
- **Standard Schema** — `@hono/standard-validator` hook (works with any schema library)
- **Type-safe** — full TypeScript support with inference
- **Zero external dependencies** — only `hono` as peer dependency
- **Edge-first** — works on Cloudflare Workers, Deno, Bun, and Node.js

## Install

```bash
npm install hono-problem-details
```

## Quick Start

```ts
import { Hono } from "hono";
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

## Throwing Problem Details

```ts
import { problemDetails } from "hono-problem-details";

app.post("/orders", (c) => {
  throw problemDetails({
    status: 409,
    title: "Conflict",
    detail: `Order ${id} already exists`,
    type: "https://api.example.com/problems/order-conflict",
    instance: `/orders/${id}`,
  });
});
```

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

## Handler Options

```ts
problemDetailsHandler({
  // Prefix for type URI (e.g., "https://api.example.com/problems")
  typePrefix: "https://api.example.com/problems",

  // Default type URI (default: "about:blank")
  defaultType: "about:blank",

  // Include stack trace in detail (for development)
  includeStack: process.env.NODE_ENV === "development",

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

## License

MIT
