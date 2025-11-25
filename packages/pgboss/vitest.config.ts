import { fileURLToPath } from "url";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "~/": fileURLToPath(new URL("./src/", import.meta.url)),
    },
  },
  test: {
    globals: true,
    exclude: [...configDefaults.exclude],

    coverage: {
      provider: "istanbul",
      reportOnFailure: true,
    },
  },
});
