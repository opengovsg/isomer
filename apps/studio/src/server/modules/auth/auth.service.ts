import type { NextApiRequest } from "next"
import type { SessionData } from "~/lib/types/session"
import { TRPCError } from "@trpc/server"
import type { PrismaClient } from "~prisma/generated/prisma/client"

import type { DB, Transaction, VerificationToken } from "../database/types"
import { logAuthEvent } from "../audit/audit.service"
import { AuditLogEvent } from "../database/types"
import { VerificationError } from "./auth.error"
import { compareHash } from "./auth.util"
import { getOtpFingerPrint } from "./email/utils"

type PrismaCaughtError = Error | { code?: string }

const isPrismaNotFoundError = (error: PrismaCaughtError): boolean =>
  "code" in error && error.code === "P2025"

export const verifyToken = async (
  prisma: PrismaClient,
  req: NextApiRequest,
  { token, email }: { token: string; email: string },
) => {
  try {
    const verificationToken = await prisma.verificationToken.update({
      data: {
        attempts: {
          increment: 1,
        },
      },
      where: {
        identifier: getOtpFingerPrint(email, req),
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
    // SAFETY: caught errors from Prisma are narrowed to the known request-error shape
    if (isPrismaNotFoundError(error as PrismaCaughtError)) {
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
    by: updatedUser,
    delta: {
      after: null,
      before: {
        ...verificationToken,
        attempts: verificationToken.attempts + 1,
      },
    },
    eventType: AuditLogEvent.Login,
  })
}
