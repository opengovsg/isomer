import { fileURLToPath } from "node:url"
import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: {
      // Mirror the tsconfig `paths`. `~generated/*` resolves to @isomer/db's
      // generated Kysely types/enums (used by the script + extracted sitemap
      // module). `~schema` is type-only at runtime, so it never needs to load,
      // but we map it for completeness.
      "~generated": fileURLToPath(
        new URL("../../../../packages/db/src/generated", import.meta.url),
      ),
    },
  },
  test: {
    globals: true,
    exclude: [...configDefaults.exclude],
    // Integration tests share a single docker-compose Postgres service and each
    // create their own database, so run files serially to avoid cross-test
    // interference on that one container.
    fileParallelism: false,
    // Schema application + container round-trips are slower than the default.
    hookTimeout: 60_000,
    testTimeout: 60_000,
  },
})
