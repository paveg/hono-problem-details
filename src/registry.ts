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
	create: <T extends Record<string, unknown>>(
		key: K,
		options?: CreateOptions<T>,
	) => ProblemDetailsError;
	get: (key: K) => ProblemTypeDefinition;
	types: () => K[];
}

/**
 * Create a registry of pre-defined problem types.
 * Provides type-safe error creation from registered definitions.
 */
export function createProblemTypeRegistry<K extends string>(
	definitions: Record<K, ProblemTypeDefinition>,
): ProblemTypeRegistry<K> {
	return {
		create: (key, options) => {
			const def = definitions[key];
			return new ProblemDetailsError({
				type: def.type,
				status: def.status,
				title: def.title,
				detail: options?.detail,
				instance: options?.instance,
				extensions: options?.extensions,
			});
		},
		get: (key) => definitions[key],
		types: () => Object.keys(definitions) as K[],
	};
}
