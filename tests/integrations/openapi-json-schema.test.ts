import { describe, expect, it } from "vitest";
import {
	problemDetailsJsonSchema,
	problemDetailsResponseJsonSchema,
} from "../../src/integrations/openapi-json-schema.js";

describe("problemDetailsJsonSchema", () => {
	it("JS1: has RFC 9457 standard fields with JSON Schema types", () => {
		const schema = problemDetailsJsonSchema();
		expect(schema.properties.type).toMatchObject({ type: "string" });
		expect(schema.properties.status).toMatchObject({ type: "integer" });
		expect(schema.properties.title).toMatchObject({ type: "string" });
		expect(schema.properties.detail).toMatchObject({ type: "string" });
		expect(schema.properties.instance).toMatchObject({ type: "string" });
	});

	it("JS2: requires exactly type, status, and title", () => {
		expect(problemDetailsJsonSchema().required).toEqual(["type", "status", "title"]);
	});

	it("JS3: is an object schema titled ProblemDetails without additionalProperties", () => {
		const schema = problemDetailsJsonSchema();
		expect(schema.title).toBe("ProblemDetails");
		expect(schema.type).toBe("object");
		expect("additionalProperties" in schema).toBe(false);
	});

	it("JS4: mirrors the Zod schema descriptions and examples", () => {
		const { properties } = problemDetailsJsonSchema();
		expect(properties.type).toMatchObject({
			description: "Problem type URI",
			examples: ["about:blank"],
		});
		expect(properties.status).toMatchObject({
			description: "HTTP status code",
			examples: [400],
		});
		expect(properties.title).toMatchObject({
			description: "Short summary of the problem type",
			examples: ["Bad Request"],
		});
		expect(properties.detail).toMatchObject({ description: "Human-readable explanation" });
		expect(properties.instance).toMatchObject({
			description: "URI identifying the occurrence",
		});
	});

	it("JS5: merges extensions as top-level optional properties", () => {
		const schema = problemDetailsJsonSchema({
			extensions: {
				conflictingResources: { type: "array", items: { type: "string" } },
			},
		});
		expect(schema.properties.conflictingResources).toEqual({
			type: "array",
			items: { type: "string" },
		});
		expect(schema.required).toEqual(["type", "status", "title"]);
	});

	it("JS6: drops extension keys that collide with standard fields", () => {
		const schema = problemDetailsJsonSchema({
			extensions: {
				status: { type: "string" },
				retryAfter: { type: "integer" },
			},
		});
		expect(schema.properties.status).toMatchObject({ type: "integer" });
		expect(schema.properties.retryAfter).toEqual({ type: "integer" });
	});

	it("JS7: returns a fresh object on every call", () => {
		const first = problemDetailsJsonSchema();
		first.properties.status = { type: "string" };
		first.required.push("detail");
		const second = problemDetailsJsonSchema();
		expect(second.properties.status).toMatchObject({ type: "integer" });
		expect(second.required).toEqual(["type", "status", "title"]);
	});
});

describe("problemDetailsResponseJsonSchema", () => {
	it("JS8: wraps the base schema under the problem+json content type", () => {
		const response = problemDetailsResponseJsonSchema(422);
		expect(response.description).toBe("Unprocessable Content");
		expect(response.content["application/problem+json"].schema).toEqual(problemDetailsJsonSchema());
	});

	it("JS9: uses the provided description over the status phrase", () => {
		const response = problemDetailsResponseJsonSchema(409, "Slot already taken");
		expect(response.description).toBe("Slot already taken");
	});

	it("JS10: falls back to 'Error' for an unknown status", () => {
		expect(problemDetailsResponseJsonSchema(599).description).toBe("Error");
	});

	it("JS11: uses the provided schema over the default", () => {
		const custom = problemDetailsJsonSchema({
			extensions: { errors: { type: "array" } },
		});
		const response = problemDetailsResponseJsonSchema(422, undefined, custom);
		expect(response.content["application/problem+json"].schema).toBe(custom);
	});
});
