import type { NextApiRequest } from "next"
import { env } from "~/env.mjs"
import getIP from "~/utils/getClientIp"

import type { Logger } from "@isomer/logging"
import { createBaseLogger as createBaseLoggerPkg } from "@isomer/logging"

interface LoggerOptions {
  path: string
  req?: NextApiRequest
}

export function createBaseLogger({ path, req }: LoggerOptions): Logger<string> {
  const traceId = req?.headers["x-datadog-trace-id"]
  return createBaseLoggerPkg({
    appEnvLabel: env.NEXT_PUBLIC_APP_ENV,
    clientIp: req && getIP(req),
    nodeEnv: env.NODE_ENV,
    path,
    traceId: Array.isArray(traceId) ? traceId[0] : traceId,
  })
}
