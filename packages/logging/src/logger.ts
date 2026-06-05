import type { DestinationStream, Logger } from "pino"
import { nanoid } from "nanoid"
import pino from "pino"
import pinoPretty from "pino-pretty"

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
  nodeEnv: string
  appEnvLabel: string
  path: string
  clientIp?: string
  traceId?: string
}

class PinoLogger {
  private static instance?: pino.Logger<string>
  // TODO: the singleton-with-args shape here is a footgun — `nodeEnv` and
  // `appEnvLabel` are only honoured on the first call and silently ignored
  // afterwards. Split into a one-shot `initRootLogger({ nodeEnv, appEnvLabel })`
  // plus a `createChildLogger(bindings)` (or throw on conflicting args) in a
  // follow-up. This PR focuses on pure porting rather than refactoring.
  private static getInstance(nodeEnv: string, appEnvLabel: string) {
    PinoLogger.instance ??= PinoLogger.createBaseLogger(nodeEnv, appEnvLabel)
    return PinoLogger.instance
  }
  private static createBaseLogger = (
    nodeEnv: string,
    appEnvLabel: string,
  ): Logger<string> => {
    let transport: DestinationStream
    if (nodeEnv === "development" || nodeEnv === "test") {
      transport = pinoPretty({
        colorize: true,
        hideObject: true,
      })
    } else {
      transport = pino.destination(1)
    }
    return pino(
      {
        // oxlint-disable-next-line node/no-process-env
        level: process.env.PINO_LOG_LEVEL || "info",
        customLevels: levels,
        useOnlyCustomLevels: true,
        timestamp: () => `,"timestamp":"${new Date(Date.now()).toISOString()}"`,
        formatters: {
          bindings: () => {
            return {
              env: appEnvLabel,
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
  public static logger = ({
    nodeEnv,
    appEnvLabel,
    path,
    clientIp,
    traceId,
  }: LoggerOptions) => {
    return PinoLogger.getInstance(nodeEnv, appEnvLabel).child({
      path,
      clientIp,
      id: nanoid<string>(),
      trace_id: traceId,
    })
  }
}

export const createBaseLogger = PinoLogger.logger
