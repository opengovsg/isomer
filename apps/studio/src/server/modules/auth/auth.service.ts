import type { NextApiRequest } from "next"
import { type Prisma, type PrismaClient } from "@prisma/client"
import { TRPCError } from "@trpc/server"

import type { DB, Transaction, VerificationToken } from "../database"
import type { SessionData } from "~/lib/types/session"
import { logAuthEvent } from "../audit/audit.service"
import { AuditLogEvent } from "../database"
import { VerificationError } from "./auth.error"
import { compareHash } from "./auth.util"
import { getOtpFingerPrint } from "./email/utils"

export const verifyToken = async (
  prisma: PrismaClient,
  req: NextApiRequest,
  { token, email }: { token: string; email: string },
) => {
  try {
    const verificationToken = await prisma.verificationToken.update({
      where: {
        identifier: getOtpFingerPrint(email, req),
      },
      data: {
        attempts: {
          increment: 1,
        },
      },
    })

    if (verificationToken.attempts > 5) {
      throw new VerificationError("Too many attempts")
    }

    if (
      verificationToken.expires.valueOf() < Date.now() ||
      !compareHash(token, email, verificationToken.token)
    ) {
      throw new VerificationError("Token is invalid or has expired")
    }

    await prisma.verificationToken.delete({
      where: {
        identifier: getOtpFingerPrint(email, req),
      },
    })

    return
  } catch (error) {
    // see error code here: https://www.prisma.io/docs/reference/api-reference/error-reference#p2025
    if ((error as Prisma.PrismaClientKnownRequestError).code === "P2025") {
      throw new VerificationError("Invalid login email")
    }
    throw error
  }
}

interface RecordUserLoginParams {
  tx: Transaction<DB>
  userId: NonNullable<SessionData["userId"]>
  verificationToken: VerificationToken
}

export const recordUserLogin = async ({
  tx,
  userId,
  verificationToken,
}: RecordUserLoginParams) => {
  const updatedUser = await tx
    .updateTable("User")
    .set({
      // NOTE: We are not logging the UserUpdate event here, as that is already
      // captured under the UserLogin event
      lastLoginAt: new Date(),
    })
    .where("id", "=", userId)
    .returningAll()
    .executeTakeFirstOrThrow(
      () =>
        new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        }),
    )

  await logAuthEvent(tx, {
    eventType: AuditLogEvent.Login,
    by: updatedUser,
    delta: {
      before: {
        ...verificationToken,
        attempts: verificationToken.attempts + 1,
      },
      after: null,
    },
  })
}
