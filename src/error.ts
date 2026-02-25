import { statusToPhrase } from "./status.js";
import type { ProblemDetails, ProblemDetailsInput } from "./types.js";
import {
	PROBLEM_JSON_CONTENT_TYPE,
	clampHttpStatus,
	safeStringify,
	sanitizeExtensions,
} from "./utils.js";

function normalizeProblemDetails<T extends Record<string, unknown>>(
	input: ProblemDetailsInput<T>,
): ProblemDetails<T> {
	return {
		type: input.type ?? "about:blank",
		status: input.status,
		title: input.title ?? statusToPhrase(input.status) ?? "Unknown Error",
		detail: input.detail,
		instance: input.instance,
		extensions: input.extensions,
	};
}

export class ProblemDetailsError extends Error {
	readonly problemDetails: ProblemDetails;

	constructor(input: ProblemDetailsInput) {
		const pd = normalizeProblemDetails(input);
		super(pd.detail ?? pd.title);
		this.name = "ProblemDetailsError";
		this.problemDetails = pd;
	}

	getResponse(): Response {
		const { extensions, ...standard } = this.problemDetails;
		const body = { ...sanitizeExtensions(extensions), ...standard };
		const { json, fallback } = safeStringify(body);
		return new Response(json, {
			status: fallback ? 500 : clampHttpStatus(this.problemDetails.status),
			headers: { "Content-Type": PROBLEM_JSON_CONTENT_TYPE },
		});
	}
}
