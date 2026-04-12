import type { Context, ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { ProblemDetailsError } from "./error.js";
import { statusToPhrase, statusToSlug } from "./status.js";
import type { ProblemDetailsHandlerOptions, ProblemDetailsInput } from "./types.js";
import { buildProblemResponse, normalizeProblemDetails } from "./utils.js";

function buildType(status: number, options: ProblemDetailsHandlerOptions): string {
	if (options.typePrefix) {
		const slug = statusToSlug(status);
		if (slug) return `${options.typePrefix}/${slug}`;
	}
	return options.defaultType ?? "about:blank";
}

function toResponse(
	input: ProblemDetailsInput,
	c: Context,
	options: ProblemDetailsHandlerOptions,
): Response {
	let pd = normalizeProblemDetails(input);

	if (options.localize) {
		try {
			pd = { ...pd, ...options.localize(pd, c) };
		} catch {
			// Fall through with the un-localized pd. A throwing localize must not
			// cause the error handler itself to throw — that would re-enter onError.
		}
	}

	c.set("problemDetails", pd);

	return buildProblemResponse(pd);
}

/**
 * Create an `app.onError` handler that returns RFC 9457 Problem Details responses.
 * Handles {@link ProblemDetailsError}, Hono `HTTPException`, and unhandled exceptions.
 *
 * @example
 * ```ts
 * import { Hono } from "hono";
 * import { problemDetailsHandler } from "hono-problem-details";
 *
 * const app = new Hono();
 * app.onError(problemDetailsHandler());
 * ```
 */
export function problemDetailsHandler(options: ProblemDetailsHandlerOptions = {}): ErrorHandler {
	return (error, c) => {
		if (error instanceof ProblemDetailsError) {
			return toResponse(error.problemDetails, c, options);
		}

		if (options.mapError) {
			const mapped = options.mapError(error);
			if (mapped) {
				return toResponse(mapped, c, options);
			}
		}

		if (error instanceof HTTPException) {
			return toResponse(
				{
					status: error.status,
					type: buildType(error.status, options),
					title: statusToPhrase(error.status),
					detail: error.message,
				},
				c,
				options,
			);
		}

		return toResponse(
			{
				status: 500,
				type: buildType(500, options),
				title: "Internal Server Error",
				detail: options.includeStack ? error.stack : undefined,
			},
			c,
			options,
		);
	};
}
