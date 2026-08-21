import type { FullConfig } from "@playwright/test"
import { chromium } from "@playwright/test"
import { execFileSync } from "child_process"
import crypto from "crypto"
import { env } from "~/env.mjs"
import { db, sql } from "~/server/modules/database"
import {
  ROLES,
  storageStateFor,
  TEST_EMAILS,
  type Role,
} from "~e2e/fixtures/auth"
import { LoginPage } from "~e2e/fixtures/login"
import { seedRolesForE2E } from "~e2e/fixtures/role"

// DATABASE_URL targets the isolated `test` DB, not local `app`. TRUNCATE on
// startup is safe. Read table names from information_schema so new tables get
// wiped without updating this list.
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

const setSingpassUuidFor = async (email: string, uuid: string) => {
  await db
    .updateTable("User")
    .set({ singpassUuid: uuid, name: "test-e2e", phone: "82345678" })
    .where("email", "=", email)
    .execute()
}

const signInOnce = async (role: keyof typeof TEST_EMAILS, baseURL: string) => {
  const email = TEST_EMAILS[role]
  const uuid = crypto.randomUUID()
  await setSingpassUuidFor(email, uuid)

  const browser = await chromium.launch()
  const ctx = await browser.newContext({ baseURL })
  const page = await ctx.newPage()
  const loginPage = new LoginPage(page)

  await page.goto("/sign-in")
  await loginPage.fillEmail(email)
  await page.getByText("Enter OTP").waitFor()
  await loginPage.fillToken(email)
  await page.getByRole("button", { name: "Sign in" }).click()
  await loginPage.mockpassLoginWith(uuid)
  await page.waitForURL(baseURL + "/")

  await ctx.storageState({ path: storageStateFor(role) })
  await browser.close()
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
// PLAYWRIGHT_TEST_PATHS. Signing in all 6 roles regardless wastes real
// browser + OTP-login time on roles a given shard's tests never use (e.g.
// the "root" shard — smoke + singpass — needs none of them). `--list` asks
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
  // Signing in too many roles is just wasted time; signing in too few
  // breaks tests, so the fallback direction only ever over-signs-in.
  let roles: readonly Role[] = ROLES
  if (testPaths.length > 0) {
    try {
      roles = rolesNeededFor(testPaths)
    } catch (error) {
      console.warn(
        "Failed to resolve roles needed for PLAYWRIGHT_TEST_PATHS — signing in all roles instead:",
        error,
      )
    }
  }

  await Promise.all(roles.map((role) => signInOnce(role, baseURL)))
}

export default globalSetup
