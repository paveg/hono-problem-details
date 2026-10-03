import type { Context, ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { ProblemDetailsError } from "./error.js";
import { getOtelTraceId } from "./integrations/opentelemetry.js";
import { statusToPhrase, statusToSlug } from "./status.js";
import type { ProblemDetailsHandlerOptions, ProblemDetailsInput } from "./types.js";
import { buildProblemResponse, normalizeProblemDetails } from "./utils.js";

// Describe the original response body, which is replaced by the problem JSON.
const REPRESENTATION_HEADERS = new Set([
	"transfer-encoding",
	"etag",
	"last-modified",
	"digest",
	"accept-ranges",
]);

function buildType(status: number, options: ProblemDetailsHandlerOptions): string {
	if (options.typePrefix) {
		const slug = statusToSlug(status);
		if (slug) return `${options.typePrefix}/${slug}`;
	}
	return options.defaultType ?? "about:blank";
}

function copyResHeaders(error: Error, response: Response): Response {
	if (error instanceof HTTPException) {
		error.res?.headers.forEach((value, name) => {
			if (!name.startsWith("content-") && !REPRESENTATION_HEADERS.has(name)) {
				response.headers.append(name, value);
			}
		});
	}
	return response;
}

function toResponse(
	input: ProblemDetailsInput,
	c: Context,
	options: ProblemDetailsHandlerOptions,
): Response {
	let pd = normalizeProblemDetails({
		...input,
		type: input.type ?? buildType(input.status, options),
	});

	if (options.autoInstance && pd.instance === undefined) {
		pd = { ...pd, instance: c.req.path };
	}

	if (options.otelApi && pd.extensions?.traceId === undefined) {
		const traceId = getOtelTraceId(options.otelApi);
		if (traceId) {
			if (!pd.extensions) {
				pd.extensions = {};
			}

			pd.extensions.traceId = traceId;
		}
	}

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
			const pd = error.problemDetails;
			return toResponse(error.hasExplicitType ? pd : { ...pd, type: undefined }, c, options);
		}

		if (options.mapError) {
			try {
				const mapped = options.mapError(error);
				if (mapped) {
					return copyResHeaders(error, toResponse(mapped, c, options));
				}
			} catch {
				// Fall through as if mapError returned undefined. A throwing mapError must not
				// escape onError, or the request rejects instead of getting a response (ADR-0005).
			}
		}

		if (error instanceof HTTPException) {
			return copyResHeaders(
				error,
				toResponse(
					{
						status: error.status,
						title: statusToPhrase(error.status),
						detail: error.message || undefined,
					},
					c,
					options,
				),
			);
		}

		if (options.onUnhandledError) {
			try {
				options.onUnhandledError(error, c);
			} catch {
				// Same rationale as localize (ADR-0003): a throwing callback must not re-enter onError.
			}
		}

		return toResponse(
			{
				status: 500,
				title: "Internal Server Error",
				detail: "An unexpected error occurred",
				extensions: options.includeStack ? { stack: error.stack } : undefined,
			},
			c,
			options,
		);
	};
}
