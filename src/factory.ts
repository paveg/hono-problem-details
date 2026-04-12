import { ProblemDetailsError } from "./error.js";
import type { ProblemDetailsInput } from "./types.js";

/**
 * Create a {@link ProblemDetailsError} from the given input.
 * Missing `type` defaults to `"about:blank"`; missing `title` is derived from the status code.
 *
 * @example
 * ```ts
 * throw problemDetails({
 *   status: 404,
 *   detail: `Order ${orderId} does not exist`,
 * });
 * ```
 */
export function problemDetails<T extends Record<string, unknown>>(
	input: ProblemDetailsInput<T>,
): ProblemDetailsError {
	return new ProblemDetailsError(input);
}
