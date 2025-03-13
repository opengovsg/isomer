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

    // Not using Prisma's `upsert` because Prisma's unique constraint with nullable fields
    // like `deletedAt` causes type issues. Prisma expects `deletedAt` to be `string|Date`
    // even when `null` is valid in the database schema.
    const user =
      (await tx.user.findFirst({
        where: {
          email: pocdexEmail,
          deletedAt: null,
        },
      })) ??
      (await tx.user.create({
        data: {
          email: pocdexEmail,
          phone: "", // TODO: add the phone in later, this is a wip
          name,
        },
      }))

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
