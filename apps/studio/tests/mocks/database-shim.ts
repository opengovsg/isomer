import type { Kysely, DB } from "@isomer/db"
import type { PrismaClient } from "~prisma/generated/prisma/client"

/** Populated by `tests/mocks/db.ts` during Vitest setup. */
export let db: Kysely<DB>
export let prisma: PrismaClient

export const setTestDatabase = (
  nextDb: Kysely<DB>,
  nextPrisma: PrismaClient,
) => {
  db = nextDb
  prisma = nextPrisma
}
