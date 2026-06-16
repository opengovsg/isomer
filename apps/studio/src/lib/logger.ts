import type { NextApiRequest } from "next"
import { env } from "~/env.mjs"
import getIP from "~/utils/getClientIp"

import {
  createBaseLogger as createBaseLoggerPkg,
  type Logger,
} from "@isomer/logging"

interface LoggerOptions {
  path: string
  req?: NextApiRequest
}

export function createBaseLogger({ path, req }: LoggerOptions): Logger<string> {
  const traceId = req?.headers["x-datadog-trace-id"]
  return createBaseLoggerPkg({
    nodeEnv: env.NODE_ENV,
    appEnvLabel: env.NEXT_PUBLIC_APP_ENV,
    path,
    clientIp: req && getIP(req),
    traceId: Array.isArray(traceId) ? traceId[0] : traceId,
  })
}
