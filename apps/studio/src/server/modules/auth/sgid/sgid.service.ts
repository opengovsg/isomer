import { type PrismaClient } from "@prisma/client"
import { TRPCError } from "@trpc/server"

import { isUserDeleted } from "~/server/modules/user/user.service"
import { isEmailWhitelisted } from "~/server/modules/whitelist/whitelist.service"
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
  const isWhitelisted = await isEmailWhitelisted(pocdexEmail)
  const isDeleted = await isUserDeleted(pocdexEmail)

  if (!isWhitelisted || isDeleted) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Unauthorized. Contact Isomer support.",
    })
  }

  return prisma.$transaction(async (tx) => {
    // Create user from email

    // Not using Prisma's `upsert` because Prisma's unique constraint with nullable fields
    // like `deletedAt` causes type issues. Prisma expects `deletedAt` to be `string|Date`
    // even when `null` is valid in the database schema.
    const existingUser = await tx.user.findFirst({
      where: {
        email: pocdexEmail,
        deletedAt: null,
      },
    })
    const user = existingUser
      ? await tx.user.update({
          where: { id: existingUser.id },
          data: { lastLoginAt: new Date() },
        })
      : await tx.user.create({
          data: {
            email: pocdexEmail,
            phone: "", // TODO: add the phone in later, this is a wip
            name,
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
