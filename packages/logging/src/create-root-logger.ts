import type { DestinationStream, Logger } from "pino"
import pino from "pino"
import pinoPretty from "pino-pretty"

import { SYSLOG_LEVELS } from "./levels"

export interface CreateRootLoggerOptions {
  /** Typically `process.env.NODE_ENV`; selects pretty vs stdout when `destination` is omitted. */
  nodeEnv: string
  /** Bound on every line as `env` (e.g. deployment/stage label). */
  appEnvLabel: string
  /**
   * Pino level name. When omitted, uses `process.env.PINO_LOG_LEVEL` if set, otherwise `info`.
   */
  logLevel?: string
  /**
   * Writable destination. Defaults to pino-pretty when `nodeEnv` is `development` or `test`,
   * otherwise stdout (`pino.destination(1)`).
   */
  destination?: DestinationStream
}

export function createRootLogger(
  options: CreateRootLoggerOptions,
): Logger<string> {
  const { nodeEnv, appEnvLabel, logLevel, destination } = options

  const transport =
    destination ??
    (nodeEnv === "development" || nodeEnv === "test"
      ? pinoPretty({
          colorize: true,
          hideObject: true,
        })
      : pino.destination(1))

  const resolvedLevel = logLevel ?? process.env.PINO_LOG_LEVEL ?? "info"

  return pino(
    {
      level: resolvedLevel,
      customLevels: SYSLOG_LEVELS,
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
