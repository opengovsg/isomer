import { readdirSync, readFileSync, statSync } from "node:fs"
import { PGlite } from "@electric-sql/pglite"
import { PrismaClient } from "@prisma/client"
import { PrismaPGlite } from "pglite-prisma-adapter"
import { vi } from "vitest"

const client = new PGlite()
const adapter = new PrismaPGlite(client)
const prisma = new PrismaClient({ adapter })

vi.mock("./src/server/prisma", () => ({
  prisma,
}))

export const resetDb = async () => {
  try {
    await client.exec(`DROP SCHEMA public CASCADE`)
    await client.exec(`CREATE SCHEMA public`)
  } catch (error) {
    console.log({ error })
  }
}

const applyExtensions = async () => {
  // Custom extension since PGLite does not have the `moddatetime` extension built-in.
  const moddateTimeReplacement = `
  CREATE OR REPLACE FUNCTION moddatetime() RETURNS trigger LANGUAGE plpgsql AS $moddatetime$
    DECLARE
      colname name;
    BEGIN
      IF (TG_NARGS = 1) THEN
        colname = TG_ARGV[0];
      ELSE
        RAISE EXCEPTION 'moddatetime(colname) requires one argument';
      END IF;

      RETURN json_populate_record(NEW, json_build_object(colname, NOW()));
    END;
  $moddatetime$;`

  await client.exec(moddateTimeReplacement)
}

const applyMigrations = async () => {
  const prismaMigrationDir = "./prisma/migrations"
  const directory = readdirSync(prismaMigrationDir).sort()
  for (const file of directory) {
    const name = `${prismaMigrationDir}/${file}`
    if (statSync(name).isDirectory()) {
      let migration = readFileSync(`${name}/migration.sql`, "utf8")
      // Omit moddatetime extension migration since it's already applied
      migration = migration.replace(
        "CREATE EXTENSION IF NOT EXISTS moddatetime;",
        "",
      )
      await client.exec(migration)
    }
  }
}

// Apply migrations before each test
beforeEach(async () => {
  await applyExtensions()
  await applyMigrations()
})

// Clean up the database after each test
afterEach(async () => {
  await resetDb()
})
