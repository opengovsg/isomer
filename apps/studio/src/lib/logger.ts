import type { NextApiRequest } from "next"
import type { DestinationStream } from "pino"
import { nanoid } from "nanoid"
import pino from "pino"
import pinoPretty from "pino-pretty"

import { env } from "~/env.mjs"
import getIP from "~/utils/getClientIp"

// use syslog protocol levels as per https://datatracker.ietf.org/doc/html/rfc5424#page-10
const levels: Record<string, number> = {
  emerg: 80,
  alert: 70,
  crit: 60,
  error: 50,
  warn: 40,
  notice: 30,
  info: 20,
  debug: 10,
}

interface LoggerOptions {
  path: string
  req?: NextApiRequest
}

export class PinoLogger {
  private static instance?: pino.Logger<string>
  private static getInstance() {
    PinoLogger.instance ??= PinoLogger.createBaseLogger()
    return PinoLogger.instance
  }
  private static createBaseLogger = (): pino.Logger<string> => {
    let transport: DestinationStream
    if (env.NODE_ENV === "development" || env.NODE_ENV === "test") {
      transport = pinoPretty({
        colorize: true,
        hideObject: true,
      })
    } else {
      transport = pino.destination(1)
    }
    return pino(
      {
        // eslint-disable-next-line no-restricted-properties
        level: process.env.PINO_LOG_LEVEL || "info",
        customLevels: levels,
        useOnlyCustomLevels: true,
        timestamp: () => `,"timestamp":"${new Date(Date.now()).toISOString()}"`,
        formatters: {
          bindings: () => {
            return {
              env: env.NEXT_PUBLIC_APP_ENV,
            }
          },
          level: (label) => {
            return { level: label.toUpperCase() }
          },
        },
      },
      transport,
    )
  }
  /*
  The logger we use inherits the bindings and transport from the parent singleton instance
  Use child loggers to avoid creating a new instance for every trpc call
  */
  public static logger = ({ path, req }: LoggerOptions) => {
    return PinoLogger.getInstance().child({
      path,
      clientIp: req && getIP(req),
      id: nanoid<string>(),
      trace_id: req?.headers["x-datadog-trace-id"],
    })
  }
}

export const createBaseLogger = PinoLogger.logger
