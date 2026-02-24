import { ProblemDetailsError } from "./error.js";
import type { ProblemDetailsInput } from "./types.js";

export function problemDetails<T extends Record<string, unknown>>(
	input: ProblemDetailsInput<T>,
): ProblemDetailsError {
	return new ProblemDetailsError(input);
}
