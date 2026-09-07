import type { NextApiRequest } from "next"
import getIP from "~/utils/getClientIp"

export const LOCALHOST = "127.0.0.1"

export const getIpFingerprint = (
  email: string,
  flattenedIp: string,
): `${string}|${string}` => `${email}|${flattenedIp}`

export const getOtpFingerPrint = (
  email: string,
  req: NextApiRequest,
): `${string}|${string}` => getIpFingerprint(email, getIP(req))
