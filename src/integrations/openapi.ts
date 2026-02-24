import { z } from "@hono/zod-openapi";
import { statusToPhrase } from "../status.js";

/**
 * Base RFC 9457 Problem Details Zod schema for OpenAPI documentation.
 * Use in createRoute() response definitions with @hono/zod-openapi.
 */
export const ProblemDetailsSchema = z
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

/**
 * Create a Problem Details schema with typed extension members.
 * Extensions are merged at top level per RFC 9457.
 */
export function createProblemDetailsSchema<T extends z.ZodRawShape>(extensions: z.ZodObject<T>) {
	return ProblemDetailsSchema.merge(extensions).openapi({ title: "ProblemDetails" });
}

/**
 * Create an OpenAPI response object for Problem Details.
 * Use in createRoute() responses: { 422: problemDetailsResponse(422) }
 */
export function problemDetailsResponse(
	status: number,
	description?: string,
	schema: z.ZodTypeAny = ProblemDetailsSchema,
) {
	return {
		content: {
			"application/problem+json": { schema },
		},
		description: description ?? statusToPhrase(status) ?? "Error",
	};
}
