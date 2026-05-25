import "dotenv/config"
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // Only set datasource URL when available — prisma generate doesn't need a
  // live DB connection and will fail if env() throws on a missing variable.
  // oxlint-disable-next-line node/no-process-env
  ...(process.env.DATABASE_URL
    ? // oxlint-disable-next-line node/no-process-env
      { datasource: { url: process.env.DATABASE_URL } }
    : {}),
})
