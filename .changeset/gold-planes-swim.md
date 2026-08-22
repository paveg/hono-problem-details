---
"hono-problem-details": minor
---

Add `hono-problem-details/openapi-json-schema`: schema-library-agnostic OpenAPI helpers for non-Zod stacks (#185).

`problemDetailsJsonSchema()` emits the RFC 9457 Problem Details schema as plain JSON Schema (draft 2020-12, the OpenAPI 3.1 base dialect) with zero dependencies, and `problemDetailsResponseJsonSchema()` wraps it as a ready-to-use OpenAPI response object for `hono-openapi`'s `describeRoute()` and similar documentation layers. Extension members merge at the top level with standard fields winning on collision, mirroring the existing Zod helpers and the runtime (ADR-0002).
