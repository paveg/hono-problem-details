/**
 * RFC 9457 Problem Details object.
 * Supports 5 standard fields + extension members.
 */
export interface ProblemDetails<T extends Record<string, unknown> = Record<string, unknown>> {
	/** Problem type URI. Default: "about:blank" */
	type: string;
	/** HTTP status code */
	status: number;
	/** Short summary of the problem type */
	title: string;
	/** Human-readable explanation specific to this occurrence */
	detail?: string;
	/** URI that identifies the specific occurrence */
	instance?: string;
	/** RFC 9457 extension members (flattened to top level on serialization) */
	extensions?: T;
}

/**
 * Input for problemDetails() factory.
 * type and title are optional (auto-derived from status).
 */
export interface ProblemDetailsInput<T extends Record<string, unknown> = Record<string, unknown>> {
	status: number;
	type?: string;
	title?: string;
	detail?: string;
	instance?: string;
	extensions?: T;
}

/**
 * Options for problemDetailsHandler().
 */
export interface ProblemDetailsHandlerOptions {
	/** Prefix for type URI. When set, status-based suffix is appended */
	typePrefix?: string;
	/** Default type URI. Defaults to "about:blank" */
	defaultType?: string;
	/** Include stack trace in detail (for development) */
	includeStack?: boolean;
	/** Custom error to ProblemDetails mapping */
	mapError?: (error: Error) => ProblemDetailsInput | undefined;
	/** Localize title/detail before sending the response */
	localize?: (pd: ProblemDetails, c: import("hono").Context) => ProblemDetails;
}
