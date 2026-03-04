import { PROBLEM_JSON_CONTENT_TYPE } from "../utils.js";

export interface ValidationError {
	field: string;
	message: string;
	code?: string;
}

export interface ValidationHookOptions {
	title?: string;
	detail?: string;
}

/** Build a RFC 9457 validation error response from formatted errors */
export function buildValidationResponse(
	errors: ValidationError[],
	options?: ValidationHookOptions,
): Response {
	const body = {
		type: "about:blank",
		status: 422,
		title: options?.title ?? "Validation Error",
		detail: options?.detail ?? "Request validation failed",
		errors,
	};

	return new Response(JSON.stringify(body), {
		status: 422,
		headers: { "Content-Type": PROBLEM_JSON_CONTENT_TYPE },
	});
}
