import {
  ISOMER_ADMINS_AND_MIGRATORS,
  ISOMER_ADMINS_AND_MIGRATORS_EMAILS,
} from "~prisma/constants"
import {
  setupAdminPermissions,
  setupUser,
} from "tests/integration/helpers/seed"

export const isomerAdminsCount = ISOMER_ADMINS_AND_MIGRATORS.length

export const setupIsomerAdmins = async ({ siteId }: { siteId: number }) => {
  for (const email of ISOMER_ADMINS_AND_MIGRATORS_EMAILS) {
    const user = await setupUser({
      email,
      isDeleted: false,
    })
    await setupAdminPermissions({ userId: user.id, siteId })
  }
}
