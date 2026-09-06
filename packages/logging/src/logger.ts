import type { DestinationStream, Logger } from "pino"
import { nanoid } from "nanoid"
import pino from "pino"
import pinoPretty from "pino-pretty"

// use syslog protocol levels as per https://datatracker.ietf.org/doc/html/rfc5424#page-10
const levels = {
  alert: 70,
  crit: 60,
  debug: 10,
  emerg: 80,
  error: 50,
  info: 20,
  notice: 30,
  warn: 40,
} satisfies Record<string, number>

interface LoggerOptions {
  nodeEnv: string
  appEnvLabel: string
  path: string
  clientIp?: string
  traceId?: string
}

let rootLogger: pino.Logger<string> | undefined

// NOTE: the singleton-with-args shape here is a footgun — `nodeEnv` and
// `appEnvLabel` are only honoured on the first call and silently ignored
// afterwards. Split into a one-shot `initRootLogger({ nodeEnv, appEnvLabel })`
// plus a `createChildLogger(bindings)` (or throw on conflicting args) in a
// follow-up. This change focuses on pure porting rather than refactoring.
const createRootLogger = (
  nodeEnv: string,
  appEnvLabel: string,
): Logger<string> => {
  const transport: DestinationStream =
    nodeEnv === "development" || nodeEnv === "test"
      ? pinoPretty({
          colorize: true,
          hideObject: true,
        })
      : pino.destination(1)

  const configuredLevel = process.env.PINO_LOG_LEVEL
  return pino(
    {
      // oxlint-disable-next-line node/no-process-env
      customLevels: levels,
      formatters: {
        bindings: () => ({
          env: appEnvLabel,
        }),
        level: (label) => ({
          level: label.toUpperCase(),
        }),
      },
      level:
        configuredLevel !== undefined && configuredLevel.length > 0
          ? configuredLevel
          : "info",
      timestamp: () => `,"timestamp":"${new Date(Date.now()).toISOString()}"`,
      useOnlyCustomLevels: true,
    },
    transport,
  )
}

const getRootLogger = (nodeEnv: string, appEnvLabel: string) => {
  rootLogger ??= createRootLogger(nodeEnv, appEnvLabel)
  return rootLogger
}

/*
The logger we use inherits the bindings and transport from the parent singleton instance
Use child loggers to avoid creating a new instance for every trpc call
*/
export const createBaseLogger = ({
  nodeEnv,
  appEnvLabel,
  path,
  clientIp,
  traceId,
}: LoggerOptions) =>
  getRootLogger(nodeEnv, appEnvLabel).child({
    clientIp,
    id: nanoid<string>(),
    path,
    trace_id: traceId,
  })
