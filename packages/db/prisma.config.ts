import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // oxlint-disable-next-line node/no-process-env
  ...(process.env.DATABASE_URL
    ? // oxlint-disable-next-line node/no-process-env
      { datasource: { url: process.env.DATABASE_URL } }
    : {}),
})
