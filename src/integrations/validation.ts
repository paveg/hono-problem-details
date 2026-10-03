import { ProblemDetailsError } from "../error.js";
import { PROBLEM_JSON_CONTENT_TYPE } from "../utils.js";

export interface ValidationError {
	field: string;
	message: string;
	code?: string;
}

export interface ValidationHookOptions {
	title?: string;
	detail?: string;
	/**
	 * Throw a `ProblemDetailsError` instead of returning a Response, so
	 * `problemDetailsHandler` builds the response and its options (`typePrefix`,
	 * `defaultType`, `localize`, `autoInstance`, `otelApi`) apply. Requires
	 * `app.onError(problemDetailsHandler())`. Default: `false`.
	 */
	delegateToHandler?: boolean;
}

/**
 * Strip C0 control characters (\x00-\x1f) and DEL (\x7f) from untrusted text.
 * Bidi/format control chars (U+2028, U+202E, etc.) are intentionally left intact
 * to avoid breaking legitimate i18n content; log consumers should apply their
 * own bidi-safe rendering.
 */
// biome-ignore lint/suspicious/noControlCharactersInRegex: intentional stripping of C0 controls
const CONTROL_CHAR_RE = /[\x00-\x1f\x7f]/g;

function stripControlChars(input: string): string {
	return input.replace(CONTROL_CHAR_RE, "");
}

function sanitizeError(error: ValidationError): ValidationError {
	return {
		field: stripControlChars(error.field),
		message: stripControlChars(error.message),
		...(error.code !== undefined ? { code: stripControlChars(error.code) } : {}),
	};
}

/** Build a RFC 9457 validation error response from formatted errors */
export function buildValidationResponse(
	errors: ValidationError[],
	options?: ValidationHookOptions,
): Response {
	const title = options?.title ?? "Validation Error";
	const detail = options?.detail ?? "Request validation failed";
	const sanitizedErrors = errors.map(sanitizeError);

	if (options?.delegateToHandler) {
		throw new ProblemDetailsError({
			status: 422,
			title,
			detail,
			extensions: { errors: sanitizedErrors },
		});
	}

	const body = {
		type: "about:blank",
		status: 422,
		title,
		detail,
		errors: sanitizedErrors,
	};

	return new Response(JSON.stringify(body), {
		status: 422,
		headers: { "Content-Type": PROBLEM_JSON_CONTENT_TYPE },
	});
}
