import { statusToPhrase } from "./status.js";
import type { ProblemDetails, ProblemDetailsInput } from "./types.js";

export const PROBLEM_JSON_CONTENT_TYPE = "application/problem+json; charset=utf-8";

const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/** Strip keys that could cause prototype pollution in downstream consumers */
export function sanitizeExtensions(
	extensions: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
	if (!extensions) return extensions;
	let filtered: Record<string, unknown> | undefined;
	for (const key of Object.keys(extensions)) {
		if (DANGEROUS_KEYS.has(key)) {
			if (!filtered) filtered = { ...extensions };
			delete filtered[key];
		}
	}
	return filtered ?? extensions;
}

/** Clamp HTTP status to 200-599 range; returns 500 for out-of-range values */
export function clampHttpStatus(status: number): number {
	return status >= 200 && status <= 599 ? status : 500;
}

const FALLBACK_BODY = JSON.stringify({
	type: "about:blank",
	status: 500,
	title: "Internal Server Error",
});

/** Normalize ProblemDetailsInput to ProblemDetails with defaults for type and title */
export function normalizeProblemDetails<T extends Record<string, unknown>>(
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

/** Build a RFC 9457 Problem Details Response from a ProblemDetails object */
export function buildProblemResponse(pd: ProblemDetails): Response {
	const { extensions, ...standard } = pd;
	const body = { ...sanitizeExtensions(extensions), ...standard };
	const { json, fallback } = safeStringify(body);
	return new Response(json, {
		status: fallback ? 500 : clampHttpStatus(pd.status),
		headers: { "Content-Type": PROBLEM_JSON_CONTENT_TYPE },
	});
}

/** JSON.stringify with fallback for non-serializable values (circular refs, BigInt) */
export function safeStringify(body: unknown): { json: string; fallback: boolean } {
	try {
		return { json: JSON.stringify(body), fallback: false };
	} catch {
		return { json: FALLBACK_BODY, fallback: true };
	}
}
