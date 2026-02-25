const STATUS_PHRASES: Record<number, string> = {
	400: "Bad Request",
	401: "Unauthorized",
	403: "Forbidden",
	404: "Not Found",
	405: "Method Not Allowed",
	406: "Not Acceptable",
	408: "Request Timeout",
	409: "Conflict",
	410: "Gone",
	411: "Length Required",
	412: "Precondition Failed",
	413: "Content Too Large",
	415: "Unsupported Media Type",
	422: "Unprocessable Content",
	429: "Too Many Requests",
	500: "Internal Server Error",
	501: "Not Implemented",
	502: "Bad Gateway",
	503: "Service Unavailable",
	504: "Gateway Timeout",
};

const STATUS_SLUGS: Record<number, string> = Object.fromEntries(
	Object.entries(STATUS_PHRASES).map(([code, phrase]) => [
		Number(code),
		phrase.toLowerCase().replace(/ /g, "-"),
	]),
);

export function statusToPhrase(status: number): string | undefined {
	return STATUS_PHRASES[status];
}

export function statusToSlug(status: number): string | undefined {
	return STATUS_SLUGS[status];
}
