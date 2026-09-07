import {
  setupAdminPermissions,
  setupUser,
} from "tests/integration/helpers/seed"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"
import { db } from "~server/db"

const ISOMER_ADMIN_TEST_EMAILS = [
  "admin1@open.gov.sg",
  "admin2@open.gov.sg",
  "migrator1@open.gov.sg",
  "migrator2@open.gov.sg",
]

export const isomerAdminsCount = ISOMER_ADMIN_TEST_EMAILS.length

export const setupIsomerAdmins = async ({ siteId }: { siteId: number }) => {
  for (const email of ISOMER_ADMIN_TEST_EMAILS) {
    // oxlint-disable-next-line eslint/no-await-in-loop -- sequential integration setup
    const user = await setupUser({
      email,
      isDeleted: false,
    })
    // oxlint-disable-next-line eslint/no-await-in-loop -- sequential integration setup
    await setupAdminPermissions({ siteId, userId: user.id })

    // Also insert into IsomerAdmin table
    const role = email.startsWith("admin")
      ? IsomerAdminRole.Core
      : IsomerAdminRole.Migrator
    // oxlint-disable-next-line eslint/no-await-in-loop -- sequential integration setup
    await db
      .insertInto("IsomerAdmin")
      .values({
        expiry: null,
        role,
        userId: user.id,
      })
      .execute()
  }
}
