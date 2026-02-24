import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		index: "src/index.ts",
		"integrations/zod": "src/integrations/zod.ts",
		"integrations/valibot": "src/integrations/valibot.ts",
	},
	format: ["esm", "cjs"],
	dts: true,
	clean: true,
	sourcemap: true,
	external: ["hono"],
});
