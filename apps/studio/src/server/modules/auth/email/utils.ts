import { NextApiRequest } from "next"

const LOCALHOST = "127.0.0.1"

export const getOtpFingerPrint = (
  email: string,
  req: NextApiRequest,
): `${string}|${string}` => {
  const originIp =
    req.headers["cf-connecting-ip"] ??
    req.socket.remoteAddress ??
    req.headers["x-forwarded-for"] ??
    LOCALHOST

  return `${email}|${originIp}`
}
