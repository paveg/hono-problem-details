import { statusToPhrase } from "../status.js";

export type JsonSchemaObject = Record<string, unknown>;

export type ProblemDetailsJsonSchema = {
	title: "ProblemDetails";
	type: "object";
	properties: Record<string, JsonSchemaObject>;
	required: string[];
};

const STANDARD_FIELD_KEYS = new Set(["type", "status", "title", "detail", "instance"]);

/**
 * Build the RFC 9457 Problem Details schema as plain JSON Schema
 * (draft 2020-12, the OpenAPI 3.1 base dialect), for stacks that document
 * responses without Zod (hono-openapi, Valibot, ArkType, typia, ...).
 *
 * Extensions are merged at top level per RFC 9457 §3.1, and **standard fields
 * always win** over extension keys that collide (mirroring the runtime spread
 * order in `problemDetails()`). Conflicting extension keys are silently
 * dropped from the schema. See ADR-0002.
 *
 * A fresh object is returned on every call so callers can safely mutate the
 * result (e.g. append to `required`) without affecting other call sites.
 */
export function problemDetailsJsonSchema(options?: {
	extensions?: Record<string, JsonSchemaObject>;
}): ProblemDetailsJsonSchema {
	const properties: Record<string, JsonSchemaObject> = {
		type: { type: "string", description: "Problem type URI", examples: ["about:blank"] },
		status: { type: "integer", description: "HTTP status code", examples: [400] },
		title: {
			type: "string",
			description: "Short summary of the problem type",
			examples: ["Bad Request"],
		},
		detail: { type: "string", description: "Human-readable explanation" },
		instance: { type: "string", description: "URI identifying the occurrence" },
	};
	for (const [key, schema] of Object.entries(options?.extensions ?? {})) {
		if (!STANDARD_FIELD_KEYS.has(key)) {
			properties[key] = schema;
		}
	}
	return {
		title: "ProblemDetails",
		type: "object",
		properties,
		required: ["type", "status", "title"],
	};
}

/**
 * Create an OpenAPI response object for Problem Details as plain JSON Schema.
 * Ready to drop into hono-openapi's describeRoute():
 * responses: { 422: problemDetailsResponseJsonSchema(422) }
 */
export function problemDetailsResponseJsonSchema(
	status: number,
	description?: string,
	schema?: JsonSchemaObject,
): {
	content: { "application/problem+json": { schema: JsonSchemaObject } };
	description: string;
} {
	return {
		content: {
			"application/problem+json": { schema: schema ?? problemDetailsJsonSchema() },
		},
		description: description ?? statusToPhrase(status) ?? "Error",
	};
}
