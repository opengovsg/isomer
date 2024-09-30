import "pino-pretty"

import type { DestinationStream } from "pino"
import { nanoid } from "nanoid"
import { pino } from "pino"

import { env } from "~/env.mjs"

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
  clientIp?: string
}

export class PinoLogger {
  private static instance?: pino.Logger<string>
  private static getInstance() {
    if (!PinoLogger.instance)
      PinoLogger.instance = PinoLogger.createBaseLogger()
    return PinoLogger.instance
  }
  private static createBaseLogger = (): pino.Logger<string> => {
    let transport: DestinationStream
    if (env.NODE_ENV === "development" || env.NODE_ENV === "test") {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      transport = pino.transport({
        target: "pino-pretty",
        options: {
          colorize: true,
          hideObject: true,
        },
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
              env: env.NODE_ENV,
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
  public static logger = ({ path, clientIp }: LoggerOptions) => {
    return PinoLogger.getInstance().child({
      path,
      clientIp,
      id: nanoid(),
    })
  }
}

export const createBaseLogger = PinoLogger.logger
