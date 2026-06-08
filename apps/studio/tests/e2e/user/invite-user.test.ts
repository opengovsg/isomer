import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { db } from "~/server/modules/database"

import { storageStateFor, TEST_EMAILS } from "../fixtures/auth"
import { getSeedSiteId } from "../fixtures/seed"

const UNIQUE_INVITEE = () =>
  `e2e-invitee-${crypto.randomUUID().slice(0, 8)}@open.gov.sg`

test.use({ storageState: storageStateFor("admin") })

test.beforeEach(async () => {
  // Welcome-modal workaround (see settings tests for rationale).
  await db
    .updateTable("User")
    .set({ name: "test-e2e", phone: "82345678" })
    .where("email", "=", TEST_EMAILS.admin)
    .execute()
})

test.afterEach(async () => {
  // Hard-delete any e2e invitee users + their permissions so re-runs are clean.
  // ResourcePermission has FK to User so delete permissions first.
  const invitees = await db
    .selectFrom("User")
    .where("email", "like", "e2e-invitee-%@open.gov.sg")
    .select(["id"])
    .execute()
  if (invitees.length === 0) return
  const ids = invitees.map((u) => u.id)
  await db.deleteFrom("ResourcePermission").where("userId", "in", ids).execute()
  await db.deleteFrom("User").where("id", "in", ids).execute()
})

test("admin can invite a new collaborator as Editor", async ({ page }) => {
  const inviteeEmail = UNIQUE_INVITEE()
  await page.goto(`/sites/${getSeedSiteId()}/users`)

  await page.getByRole("button", { name: "Add new user" }).click()

  // Modal opens; fill email + pick Editor role + send.
  await page.getByLabel("Email address").fill(inviteeEmail)
  // RoleBoxes are clickable cards labeled by role name.
  await page.getByRole("button", { name: /^Editor/ }).click()

  const sendBtn = page.getByRole("button", { name: "Send invite" })
  // The form debounces email + runs a whitelist check before enabling Send.
  await expect(sendBtn).toBeEnabled({ timeout: 10_000 })
  await sendBtn.click()

  // Verify in DB: invitee user exists with an active permission on the seed site.
  await expect
    .poll(
      async () => {
        const row = await db
          .selectFrom("User as u")
          .innerJoin("ResourcePermission as rp", "rp.userId", "u.id")
          .where("u.email", "=", inviteeEmail)
          .where("rp.siteId", "=", getSeedSiteId())
          .where("rp.deletedAt", "is", null)
          .select(["rp.role"])
          .executeTakeFirst()
        return row?.role ?? null
      },
      { timeout: 10_000 },
    )
    .toBe("Editor")
})
