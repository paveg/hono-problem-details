import { ProblemDetailsError } from "./error.js";

interface ProblemTypeDefinition {
	type: string;
	status: number;
	title: string;
	/**
	 * Explicit `code` extension for this type. Always emitted, regardless of
	 * `autoCode`, and takes priority over an `autoCode`-derived value.
	 */
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
	/**
	 * Get the resolved definition for a registered key, including any
	 * `autoCode`-derived or explicit `code` that `create()` would emit.
	 */
	get: (key: K) => ProblemTypeDefinition;
	/** List all registered problem type keys. */
	types: () => K[];
}

/**
 * Derive a `code` extension from a SCREAMING_SNAKE_CASE registry key.
 * Lowercases, collapses runs of underscores into a single hyphen, and strips
 * leading/trailing hyphens.
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
	const resolved = new Map<K, ProblemTypeDefinition>(
		(Object.keys(definitions) as K[]).map((key) => {
			const definition = definitions[key];
			const code = definition.code ?? (autoCode ? deriveCode(key) : undefined);
			return [key, code === undefined ? definition : { ...definition, code }];
		}),
	);
	return {
		create: (key, createOptions) => {
			const { code, ...definition } = resolved.get(key) ?? ({} as ProblemTypeDefinition);
			const extensions =
				code !== undefined ? { code, ...createOptions?.extensions } : createOptions?.extensions;
			return new ProblemDetailsError({ ...definition, ...createOptions, extensions });
		},
		get: (key) => resolved.get(key) as ProblemTypeDefinition,
		types: () => [...resolved.keys()],
	};
}
