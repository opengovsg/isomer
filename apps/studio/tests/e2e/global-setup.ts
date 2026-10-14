import type { FullConfig } from "@playwright/test"
import { execFileSync } from "child_process"
import { env } from "~/env.mjs"
import { db, sql } from "~/server/modules/database"

import { ROLES, TEST_EMAILS, type Role } from "./fixtures/auth"
import { seedRolesForE2E } from "./fixtures/seed"
import { mintStorageStateForRole } from "./fixtures/session-mint"

// The e2e suite's DATABASE_URL points at a `test` database that has no
// purpose other than e2e fixtures (a separate logical database from local
// dev's `app` database, inside the same docker-compose Postgres container),
// so wiping it completely at the start of every run is safe. The table list
// is derived dynamically from information_schema so this doesn't silently
// go stale as the schema evolves.
const E2E_DATABASE_NAME = "test"

const resetE2EDatabase = async (): Promise<void> => {
  // dotenv (used to load .env.test) does not override an already-set
  // DATABASE_URL by default, so a shell that already has the dev DATABASE_URL
  // exported would otherwise cause this to silently truncate the dev
  // database instead of the disposable e2e one.
  const databaseName = new URL(env.DATABASE_URL).pathname.replace(/^\//, "")
  if (databaseName !== E2E_DATABASE_NAME) {
    throw new Error(
      `Refusing to reset database: expected DATABASE_URL to point at the disposable "${E2E_DATABASE_NAME}" database, but it points at "${databaseName}". Check that .env.test is loaded before running e2e tests.`,
    )
  }

  const { rows: tables } = await sql<{
    table_name: string
  }>`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name != '_prisma_migrations'
  `.execute(db)

  if (tables.length === 0) return

  const tableList = sql.join(
    tables.map(({ table_name }) => sql.table(table_name)),
  )

  await db.executeQuery(
    sql`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`.compile(db),
  )
}

interface JsonReporterSuite {
  specs?: { tests?: { projectName?: string }[] }[]
  suites?: JsonReporterSuite[]
}

const collectProjectNames = (suite: JsonReporterSuite, out: Set<string>) => {
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      if (test.projectName) out.add(test.projectName)
    }
  }
  for (const nested of suite.suites ?? []) collectProjectNames(nested, out)
}

// CI shards e2e by feature directory (see the e2e-tests matrix in
// .github/workflows/ci.yml) and passes the paths for this shard via
// PLAYWRIGHT_TEST_PATHS. Minting storage state for all 6 roles regardless
// wastes time on roles a given shard's tests never use (e.g. the "root"
// shard — smoke + login-flow — needs none of them). `--list` asks
// Playwright's own project/grep resolution which roles actually apply,
// rather than re-deriving it from source (which loop-generated `roleTag`
// calls make unreliable to parse statically).
const rolesNeededFor = (paths: string[]): Role[] => {
  const output = execFileSync(
    "pnpm",
    ["exec", "playwright", "test", "--list", "--reporter=json", ...paths],
    { encoding: "utf8" },
  )
  const report = JSON.parse(output) as { suites: JsonReporterSuite[] }

  const projectNames = new Set<string>()
  report.suites.forEach((suite) => collectProjectNames(suite, projectNames))

  return ROLES.filter((role) => projectNames.has(role))
}

const globalSetup = async (config: FullConfig) => {
  const baseURL = config.projects[0]?.use.baseURL ?? "http://127.0.0.1:3000"

  await resetE2EDatabase()
  await seedRolesForE2E()

  const testPaths =
    process.env.PLAYWRIGHT_TEST_PATHS?.split(/\s+/).filter(Boolean) ?? []
  // Fall back to every role — for a full local run (no PLAYWRIGHT_TEST_PATHS)
  // and defensively if resolving the shard's roles fails for any reason.
  // Minting too many roles is just wasted time; minting too few breaks tests,
  // so the fallback direction only ever over-mints.
  let roles: readonly Role[] = ROLES
  if (testPaths.length > 0) {
    try {
      roles = rolesNeededFor(testPaths)
    } catch (error) {
      console.warn(
        "Failed to resolve roles needed for PLAYWRIGHT_TEST_PATHS — minting storage state for all roles instead:",
        error,
      )
    }
  }

  await Promise.all(
    roles.map(async (role) => {
      try {
        await mintStorageStateForRole({ role, baseURL })
      } catch (error) {
        console.error(
          `Failed to mint storage state for role=${role} email=${TEST_EMAILS[role]}:`,
          error,
        )
        throw error
      }
    }),
  )
}

export default globalSetup
