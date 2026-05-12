import { z } from "@hono/zod-openapi";
import { statusToPhrase } from "../status.js";

type ProblemDetailsShape = {
	type: z.ZodString;
	status: z.ZodNumber;
	title: z.ZodString;
	detail: z.ZodOptional<z.ZodString>;
	instance: z.ZodOptional<z.ZodString>;
};

let _cached: z.ZodObject<ProblemDetailsShape> | undefined;

/**
 * Build the RFC 9457 Problem Details Zod schema for OpenAPI documentation.
 *
 * The schema is constructed lazily on first call and memoized for subsequent
 * calls. Deferring construction past module load avoids `TypeError` failures
 * under bundlers that resolve duplicate `zod` instances, because the
 * `@hono/zod-openapi` prototype patch must be in place before `.openapi()`
 * runs. See ADR-0004 for the full rationale.
 */
export function getProblemDetailsSchema(): z.ZodObject<ProblemDetailsShape> {
	if (!_cached) {
		_cached = z
			.object({
				type: z.string().openapi({ description: "Problem type URI", example: "about:blank" }),
				status: z.number().int().openapi({ description: "HTTP status code", example: 400 }),
				title: z
					.string()
					.openapi({ description: "Short summary of the problem type", example: "Bad Request" }),
				detail: z.string().optional().openapi({ description: "Human-readable explanation" }),
				instance: z.string().optional().openapi({ description: "URI identifying the occurrence" }),
			})
			.openapi({ title: "ProblemDetails" });
	}
	return _cached;
}

const STANDARD_FIELD_KEYS = new Set(["type", "status", "title", "detail", "instance"]);

/**
 * Create a Problem Details schema with typed extension members.
 *
 * Extensions are merged at top level per RFC 9457 §3.1, and **standard fields
 * always win** over extension keys that collide (mirroring the runtime spread
 * order in `problemDetails()`). Conflicting extension keys are silently
 * dropped from the schema.
 */
export function createProblemDetailsSchema<T extends z.ZodRawShape>(
	extensions: z.ZodObject<T>,
): z.ZodObject {
	const safeShape = Object.fromEntries(
		Object.entries(extensions.shape).filter(([key]) => !STANDARD_FIELD_KEYS.has(key)),
	);
	return getProblemDetailsSchema().extend(safeShape).openapi({ title: "ProblemDetails" });
}

/**
 * Create an OpenAPI response object for Problem Details.
 * Use in createRoute() responses: { 422: problemDetailsResponse(422) }
 */
export function problemDetailsResponse(
	status: number,
	description?: string,
	schema?: z.ZodType,
): {
	content: { "application/problem+json": { schema: z.ZodType } };
	description: string;
} {
	return {
		content: {
			"application/problem+json": { schema: schema ?? getProblemDetailsSchema() },
		},
		description: description ?? statusToPhrase(status) ?? "Error",
	};
}
