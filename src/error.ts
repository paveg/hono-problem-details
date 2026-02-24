import { statusToPhrase } from "./status.js";
import type { ProblemDetails, ProblemDetailsInput } from "./types.js";

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
		const body = { ...standard, ...extensions };
		return new Response(JSON.stringify(body), {
			status: this.problemDetails.status,
			headers: { "Content-Type": "application/problem+json" },
		});
	}
}
