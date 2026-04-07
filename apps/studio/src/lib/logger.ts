import type { NextApiRequest } from "next"
import type { Logger } from "pino"
import { env } from "~/env.mjs"
import getIP from "~/utils/getClientIp"

import { createChildLogger, createRootLogger } from "@isomer/logging"

let root: Logger<string> | undefined

function getRootLogger(): Logger<string> {
  root ??= createRootLogger({
    nodeEnv: env.NODE_ENV,
    appEnvLabel: env.NEXT_PUBLIC_APP_ENV,
  })
  return root
}

function datadogTraceIdFromRequest(req: NextApiRequest | undefined) {
  const raw = req?.headers["x-datadog-trace-id"]
  if (typeof raw === "string") {
    return raw
  }
  if (Array.isArray(raw)) {
    return raw[0]
  }
  return undefined
}

interface LoggerOptions {
  path: string
  req?: NextApiRequest
}

export function createLogger({ path, req }: LoggerOptions): Logger<string> {
  return createChildLogger(getRootLogger(), {
    path,
    clientIp: req ? getIP(req) : undefined,
    traceId: datadogTraceIdFromRequest(req),
  })
}
