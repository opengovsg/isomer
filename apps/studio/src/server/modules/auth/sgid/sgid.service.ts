import { type PrismaClient } from "@prisma/client"

import { createPocdexAccountProviderId } from "../auth.util"
import { type SgidSessionProfile } from "./sgid.utils"

export const upsertSgidAccountAndUser = async ({
  prisma,
  pocdexEmail,
  name,
  sub,
}: {
  prisma: PrismaClient
  pocdexEmail: NonNullable<SgidSessionProfile["list"][number]["work_email"]>
  name: SgidSessionProfile["name"]
  sub: SgidSessionProfile["sub"]
}) => {
  return prisma.$transaction(async (tx) => {
    // Create user from email
    const user = await tx.user.upsert({
      where: {
        email: pocdexEmail,
      },
      update: {
        lastLoginAt: new Date(),
      },
      create: {
        email: pocdexEmail,
        name,
        // TODO: add later
        phone: "",
      },
    })

    // Link user to account
    // TODO: Remnant of unused code, to remove
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const pocdexProviderAccountId = createPocdexAccountProviderId(
      sub,
      pocdexEmail,
    )

    return user
  })
}
