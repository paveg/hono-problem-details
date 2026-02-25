import { bench, describe } from "vitest";
import { statusToPhrase, statusToSlug } from "../src/status.js";

describe("statusToSlug", () => {
	bench("lookup known status 404", () => {
		statusToSlug(404);
	});

	bench("lookup known status 500", () => {
		statusToSlug(500);
	});

	bench("lookup unknown status 999", () => {
		statusToSlug(999);
	});
});

describe("statusToPhrase", () => {
	bench("lookup known status 404", () => {
		statusToPhrase(404);
	});

	bench("lookup unknown status 999", () => {
		statusToPhrase(999);
	});
});
