import type { DestinationStream, Logger } from "pino"
import { nanoid } from "nanoid"
import pino from "pino"
import pinoPretty from "pino-pretty"

import { SYSLOG_LEVELS } from "./levels"

export interface CreateBaseLoggerOptions {
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
  /** Binds `path` on each log line. */
  path: string
  clientIp?: string
  traceId?: string
}

type RootLoggerOptions = Pick<
  CreateBaseLoggerOptions,
  "nodeEnv" | "appEnvLabel" | "logLevel" | "destination"
>

class PinoLogger {
  private static instance: ReturnType<typeof this.createBaseLogger> | undefined
  private static getInstance(options: RootLoggerOptions) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    PinoLogger.instance ??= PinoLogger.createBaseLogger(options)
    return PinoLogger.instance
  }

  private static createBaseLogger = (
    options: RootLoggerOptions,
  ): Logger<string> => {
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

  static logger(options: CreateBaseLoggerOptions): Logger<string> {
    const {
      path,
      clientIp,
      traceId,
      nodeEnv,
      appEnvLabel,
      logLevel,
      destination,
    } = options
    return PinoLogger.getInstance({
      nodeEnv,
      appEnvLabel,
      logLevel,
      destination,
    }).child({
      path,
      clientIp,
      id: nanoid<string>(),
      trace_id: traceId,
    })
  }

  static resetInstanceForTests(): void {
    PinoLogger.instance = undefined
  }
}

export function createBaseLogger(
  options: CreateBaseLoggerOptions,
): Logger<string> {
  return PinoLogger.logger(options)
}

/** @internal Vitest: each test may configure a different file destination on the root. */
export function resetPinoLoggerRootForTests(): void {
  PinoLogger.resetInstanceForTests()
}
