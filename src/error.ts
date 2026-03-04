import type { ProblemDetails, ProblemDetailsInput } from "./types.js";
import { buildProblemResponse, normalizeProblemDetails } from "./utils.js";

export class ProblemDetailsError extends Error {
	readonly problemDetails: ProblemDetails;

	constructor(input: ProblemDetailsInput) {
		const pd = normalizeProblemDetails(input);
		super(pd.detail ?? pd.title);
		this.name = "ProblemDetailsError";
		this.problemDetails = pd;
	}

	getResponse(): Response {
		return buildProblemResponse(this.problemDetails);
	}
}
