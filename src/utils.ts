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

/** Clamp HTTP status to the range accepted by the Response constructor (200-599) */
export function clampHttpStatus(status: number): number {
	return status >= 200 && status <= 599 ? status : 500;
}
