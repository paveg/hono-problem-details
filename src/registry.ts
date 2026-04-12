import { ProblemDetailsError } from "./error.js";

interface ProblemTypeDefinition {
	type: string;
	status: number;
	title: string;
}

interface CreateOptions<T extends Record<string, unknown> = Record<string, unknown>> {
	detail?: string;
	instance?: string;
	extensions?: T;
}

interface ProblemTypeRegistry<K extends string> {
	/** Create a {@link ProblemDetailsError} from a registered problem type key. */
	create: <T extends Record<string, unknown>>(
		key: K,
		options?: CreateOptions<T>,
	) => ProblemDetailsError;
	/** Get the base definition (type, status, title) for a registered key. */
	get: (key: K) => ProblemTypeDefinition;
	/** List all registered problem type keys. */
	types: () => K[];
}

/**
 * Create a registry of pre-defined problem types.
 * Provides type-safe error creation from registered definitions.
 *
 * @example
 * ```ts
 * const problems = createProblemTypeRegistry({
 *   ORDER_CONFLICT: {
 *     type: "https://api.example.com/problems/order-conflict",
 *     status: 409,
 *     title: "Order Conflict",
 *   },
 * });
 * throw problems.create("ORDER_CONFLICT", { detail: "Already exists" });
 * ```
 */
export function createProblemTypeRegistry<K extends string>(
	definitions: Record<K, ProblemTypeDefinition>,
): ProblemTypeRegistry<K> {
	return {
		create: (key, options) => new ProblemDetailsError({ ...definitions[key], ...options }),
		get: (key) => definitions[key],
		types: () => Object.keys(definitions) as K[],
	};
}
