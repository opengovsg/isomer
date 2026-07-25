import type { FullConfig } from "@playwright/test"
import { chromium } from "@playwright/test"
import crypto from "crypto"
import { db, sql } from "~/server/modules/database"

import { ROLES, storageStateFor, TEST_EMAILS } from "./fixtures/auth"
import { LoginPage } from "./fixtures/login"
import { seedRolesForE2E } from "./fixtures/seed"

// The e2e suite's DATABASE_URL points at a `test` database that has no
// purpose other than e2e fixtures (a separate logical database from local
// dev's `app` database, inside the same docker-compose Postgres container),
// so wiping it completely at the start of every run is safe. The table list
// is derived dynamically from information_schema so this doesn't silently
// go stale as the schema evolves.
const resetE2EDatabase = async (): Promise<void> => {
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

const globalSetup = async (config: FullConfig) => {
  const baseURL = config.projects[0]?.use.baseURL ?? "http://127.0.0.1:3000"

  await resetE2EDatabase()
  await seedRolesForE2E()

  for (const role of ROLES) {
    await signInOnce(role, baseURL)
  }
}

export default globalSetup
