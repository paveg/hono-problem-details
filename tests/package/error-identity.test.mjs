// Needs `pnpm build`: the vitest suite imports src, so it cannot see per-entry class copies in dist.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { describe, test } from "node:test";
import { sValidator } from "@hono/standard-validator";
import { vValidator } from "@hono/valibot-validator";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import * as v from "valibot";
import { z } from "zod";

const require = createRequire(import.meta.url);

const loaders = {
	cjs: async (subpath) => require(`hono-problem-details${subpath}`),
	esm: async (subpath) => import(`hono-problem-details${subpath}`),
};

const hooks = [
	{
		name: "zod",
		subpath: "/zod",
		validator: (m) =>
			zValidator(
				"json",
				z.object({ a: z.string() }),
				m.zodProblemHook({ delegateToHandler: true }),
			),
	},
	{
		name: "valibot",
		subpath: "/valibot",
		validator: (m) =>
			vValidator(
				"json",
				v.object({ a: v.string() }),
				m.valibotProblemHook({ delegateToHandler: true }),
			),
	},
	{
		name: "standard-schema",
		subpath: "/standard-schema",
		validator: (m) =>
			sValidator(
				"json",
				z.object({ a: z.string() }),
				m.standardSchemaProblemHook({ delegateToHandler: true }),
			),
	},
];

for (const [format, load] of Object.entries(loaders)) {
	describe(`D1 ${format}: hook errors reach problemDetailsHandler as ProblemDetailsError`, () => {
		for (const hook of hooks) {
			test(`${hook.name} hook with delegateToHandler answers 422`, async () => {
				const core = await load("");
				const integration = await load(hook.subpath);
				const app = new Hono();
				app.onError(core.problemDetailsHandler());
				app.post("/", hook.validator(integration), (c) => c.text("ok"));

				const res = await app.request("/", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ a: 1 }),
				});

				assert.equal(res.status, 422);
			});
		}
	});
}
