import { ProblemDetailsError } from "./error.js";

interface ProblemTypeDefinition {
	type: string;
	status: number;
	title: string;
	/** Explicit `code` extension for this type. Overrides `autoCode` derivation. */
	code?: string;
}

interface CreateOptions<T extends Record<string, unknown> = Record<string, unknown>> {
	detail?: string;
	instance?: string;
	extensions?: T;
}

interface RegistryOptions {
	/**
	 * Derive a `code` extension from each registry key (SCREAMING_SNAKE -> kebab-case)
	 * when the definition doesn't set an explicit `code`. Default: `false`.
	 */
	autoCode?: boolean;
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
 * Derive a `code` extension from a SCREAMING_SNAKE_CASE registry key.
 * Lowercases, collapses runs of underscores into a single hyphen, and strips
 * leading/trailing hyphens. Non-ASCII characters pass through unchanged.
 */
function deriveCode(key: string): string {
	return key
		.toLowerCase()
		.replace(/_+/g, "-")
		.replace(/^-+|-+$/g, "");
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
 *
 * Pass `{ autoCode: true }` to derive a `code` extension from each key, unless the
 * definition sets an explicit `code` or the caller passes `extensions.code` to `create()`.
 */
export function createProblemTypeRegistry<K extends string>(
	definitions: Record<K, ProblemTypeDefinition>,
	options?: RegistryOptions,
): ProblemTypeRegistry<K> {
	const autoCode = options?.autoCode ?? false;
	return {
		create: (key, createOptions) => {
			const { code, ...definition } = definitions[key];
			const resolvedCode = code ?? (autoCode ? deriveCode(key) : undefined);
			const extensions =
				resolvedCode !== undefined
					? { code: resolvedCode, ...createOptions?.extensions }
					: createOptions?.extensions;
			return new ProblemDetailsError({ ...definition, ...createOptions, extensions });
		},
		get: (key) => definitions[key],
		types: () => Object.keys(definitions) as K[],
	};
}
