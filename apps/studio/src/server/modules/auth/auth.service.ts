import type { NextApiRequest } from "next"
import { type Prisma, type PrismaClient } from "@prisma/client"

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
