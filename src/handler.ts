import type { Context, ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { ProblemDetailsError } from "./error.js";
import { statusToPhrase, statusToSlug } from "./status.js";
import type { ProblemDetailsHandlerOptions, ProblemDetailsInput } from "./types.js";
import { PROBLEM_JSON_CONTENT_TYPE, clampHttpStatus, sanitizeExtensions } from "./utils.js";

export { PROBLEM_JSON_CONTENT_TYPE, sanitizeExtensions };

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
	let pd = {
		type: input.type ?? "about:blank",
		status: input.status,
		title: input.title ?? statusToPhrase(input.status) ?? "Unknown Error",
		detail: input.detail,
		instance: input.instance,
		extensions: input.extensions,
	};

	if (options.localize) {
		pd = { ...pd, ...options.localize(pd, c) };
	}

	const { extensions, ...rest } = pd;
	const body = { ...sanitizeExtensions(extensions), ...rest };

	c.set("problemDetails", pd);

	const httpStatus = clampHttpStatus(pd.status);

	return new Response(JSON.stringify(body), {
		status: httpStatus,
		headers: { "Content-Type": PROBLEM_JSON_CONTENT_TYPE },
	});
}

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
