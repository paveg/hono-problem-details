import type * as otelApi from "@opentelemetry/api";

/**
 * Safely retrieve the current trace ID from OpenTelemetry, if available.
 */
export function getOtelTraceId(api: typeof otelApi): string | undefined {
	try {
		const span = api.trace.getSpan(api.context.active());
		const traceId = span?.spanContext().traceId;
		return traceId;
	} catch {
		return undefined;
	}
}
