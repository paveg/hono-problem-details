import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { describe, expect, it } from "vitest";
import { problemDetailsHandler } from "../../src/handler.js";
import {
	ProblemDetailsSchema,
	createProblemDetailsSchema,
	problemDetailsResponse,
} from "../../src/integrations/openapi.js";

describe("ProblemDetailsSchema", () => {
	it("O1: has RFC 9457 standard fields", () => {
		const shape = ProblemDetailsSchema.shape;
		expect(shape.type).toBeDefined();
		expect(shape.status).toBeDefined();
		expect(shape.title).toBeDefined();
		expect(shape.detail).toBeDefined();
		expect(shape.instance).toBeDefined();
	});

	it("O2: validates a valid Problem Details object", () => {
		const result = ProblemDetailsSchema.safeParse({
			type: "about:blank",
			status: 404,
			title: "Not Found",
		});
		expect(result.success).toBe(true);
	});

	it("O3: status is required", () => {
		const result = ProblemDetailsSchema.safeParse({
			type: "about:blank",
			title: "Error",
		});
		expect(result.success).toBe(false);
	});

	it("O4: detail and instance are optional", () => {
		const result = ProblemDetailsSchema.safeParse({
			type: "about:blank",
			status: 400,
			title: "Bad Request",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.detail).toBeUndefined();
			expect(result.data.instance).toBeUndefined();
		}
	});

	it("O5: has OpenAPI metadata", () => {
		const metadata = ProblemDetailsSchema._def.openapi?.metadata;
		expect(metadata).toBeDefined();
		expect(metadata?.title).toBe("ProblemDetails");
	});
});

describe("createProblemDetailsSchema", () => {
	it("O6: creates schema with extension members", () => {
		const schema = createProblemDetailsSchema(
			z.object({
				errors: z.array(
					z.object({
						field: z.string(),
						message: z.string(),
					}),
				),
			}),
		);

		const result = schema.safeParse({
			type: "about:blank",
			status: 422,
			title: "Validation Error",
			errors: [{ field: "email", message: "invalid" }],
		});
		expect(result.success).toBe(true);
	});

	it("O7: extension members are at top level (not nested)", () => {
		const schema = createProblemDetailsSchema(
			z.object({
				traceId: z.string(),
			}),
		);

		const result = schema.safeParse({
			type: "about:blank",
			status: 500,
			title: "Internal Server Error",
			traceId: "abc-123",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.traceId).toBe("abc-123");
		}
	});

	it("O8: extension schema preserves OpenAPI metadata", () => {
		const schema = createProblemDetailsSchema(
			z.object({
				retryAfter: z.number(),
			}),
		);

		const metadata = schema._def.openapi?.metadata;
		expect(metadata).toBeDefined();
		expect(metadata?.title).toBe("ProblemDetails");
	});
});

describe("problemDetailsResponse", () => {
	it("O9: creates OpenAPI response object for given status", () => {
		const response = problemDetailsResponse(422, "Validation failed");
		expect(response).toEqual({
			content: {
				"application/problem+json": {
					schema: expect.any(Object),
				},
			},
			description: "Validation failed",
		});
	});

	it("O10: uses default description if not provided", () => {
		const response = problemDetailsResponse(404);
		expect(response.description).toBe("Not Found");
	});

	it("O11: accepts custom schema with extensions", () => {
		const customSchema = createProblemDetailsSchema(
			z.object({
				errors: z.array(z.object({ field: z.string(), message: z.string() })),
			}),
		);
		const response = problemDetailsResponse(422, "Validation Error", customSchema);
		expect(response.content["application/problem+json"].schema).toBe(customSchema);
	});

	it("O12: uses ProblemDetailsSchema as default schema", () => {
		const response = problemDetailsResponse(500);
		expect(response.content["application/problem+json"].schema).toBe(ProblemDetailsSchema);
	});

	it("O15: falls back to 'Error' for unknown status code", () => {
		const response = problemDetailsResponse(418);
		expect(response.description).toBe("Error");
	});
});

describe("OpenAPI integration E2E", () => {
	it("O13: ProblemDetailsSchema works in createRoute response", async () => {
		const app = new OpenAPIHono();
		app.onError(problemDetailsHandler());

		const route = createRoute({
			method: "get",
			path: "/items/{id}",
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
					description: "Item found",
				},
				404: problemDetailsResponse(404),
			},
		});

		app.openapi(route, (c) => {
			return c.json({ id: c.req.valid("param").id, name: "Test" }, 200);
		});

		const res = await app.request("/items/1");
		expect(res.status).toBe(200);
	});

	it("O14: generated OpenAPI doc includes Problem Details schema", () => {
		const app = new OpenAPIHono();

		const route = createRoute({
			method: "get",
			path: "/test",
			responses: {
				200: {
					content: {
						"application/json": {
							schema: z.object({ ok: z.boolean() }),
						},
					},
					description: "Success",
				},
				400: problemDetailsResponse(400),
			},
		});

		app.openapi(route, (c) => c.json({ ok: true }, 200));

		const doc = app.getOpenAPI31Document({
			openapi: "3.1.0",
			info: { title: "Test", version: "1.0.0" },
		});

		const response400 = doc.paths?.["/test"]?.get?.responses?.["400"];
		expect(response400).toBeDefined();
		const content = (response400 as Record<string, unknown>)?.content as Record<string, unknown>;
		expect(content?.["application/problem+json"]).toBeDefined();
	});
});
