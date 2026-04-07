import type { DestinationStream } from "pino"
import { nanoid } from "nanoid"
import { pino } from "pino"
import pinoPretty from "pino-pretty"

import type { BasicLogger, LogInput } from "./types"
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

export class PinoLogger {
  private static instance: ReturnType<typeof this.createBaseLogger>
  private static getInstance(options: CreateRootLoggerOptions) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    PinoLogger.instance ??= PinoLogger.createBaseLogger(options)
    return PinoLogger.instance
  }
  private static createBaseLogger = (options: CreateRootLoggerOptions) => {
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
  /*
    The logger we use inherits the bindings and transport from the parent singleton instance
    Use child loggers to avoid creating a new instance for every tRPC call
  */
  public static logger = ({
    path,
    nodeEnv,
    appEnvLabel,
    logLevel,
    destination,
    traceId,
    clientIp,
  }: {
    path: string
    nodeEnv: string
    appEnvLabel: string
    logLevel?: string
    destination?: DestinationStream
    clientIp?: string
    traceId?: string
  }) => {
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
}

export type ScopedLogInput = Omit<LogInput, "action"> & { action?: string }
export interface LoggerInterface<T extends ScopedLogInput = LogInput> {
  createScopedLogger(options: {
    action: string | [string, ...string[]]
    context?: LogInput["context"]
  }): LoggerInterface<ScopedLogInput>
  debug(input: Omit<T, "error">): void
  info(input: Omit<T, "error">): void
  notice(input: T): void
  warn(input: T): void
  error(input: T): void
  alert(input: T): void
  critical(input: T): void
}

export class CustomLogger<
  T extends ScopedLogInput = LogInput,
> implements LoggerInterface<T> {
  private logger: ReturnType<typeof PinoLogger.logger>
  private context: NonNullable<LogInput["context"]> | null
  private action: string[] | null

  static getInstance({
    path,
    nodeEnv,
    appEnvLabel,
    logLevel,
    destination,
    traceId,
    clientIp,
  }: {
    path: string
    nodeEnv: string
    appEnvLabel: string
    logLevel?: string
    destination?: DestinationStream
    clientIp?: string
    traceId?: string
  }) {
    const logger = PinoLogger.logger({
      path,
      nodeEnv,
      appEnvLabel,
      logLevel,
      destination,
      traceId,
      clientIp,
    })
    return new CustomLogger(logger)
  }

  constructor(
    logger: ReturnType<typeof PinoLogger.logger>,
    options?: {
      action: string[]
      context?: LogInput["context"]
    },
  ) {
    this.logger = logger
    if (options) {
      this.action = [...options.action]
      this.context = { ...options.context }
    } else {
      this.action = null
      this.context = null
    }
  }

  createScopedLogger(options: {
    action: string | [string, ...string[]]
    context?: LogInput["context"]
  }): LoggerInterface<ScopedLogInput> {
    const context = { ...this.context, ...options.context }
    const action = [...(this.action ?? [])].concat(
      typeof options.action === "string" ? [options.action] : options.action,
    )

    return new CustomLogger<ScopedLogInput>(this.logger, { action, context })
  }

  debug(input: Omit<T, "error">) {
    return this.formatLog("debug", input)
  }
  info(input: Omit<T, "error">) {
    return this.formatLog("info", input)
  }
  notice(input: T) {
    return this.formatLogWithErrors("notice", input)
  }
  warn(input: T) {
    return this.formatLogWithErrors("warn", input)
  }
  error(input: T) {
    return this.formatLogWithErrors("error", input)
  }
  alert(input: T) {
    return this.formatLogWithErrors("alert", input)
  }
  critical(input: T) {
    return this.formatLogWithErrors("critical", input)
  }

  private formatLog(level: "debug" | "info", input: ScopedLogInput) {
    const { message, context, merged, ...rest } = this.formatInput(input)
    return this.logger[level]({ context, ...merged, ...rest }, message)
  }

  private formatLogWithErrors(
    level: "notice" | "warn" | "error" | "alert" | "critical" | "fatal",
    input: ScopedLogInput,
  ) {
    const { message, context, error, merged, ...rest } = this.formatInput(input)

    if (error instanceof Error) {
      return this.logger[level]?.(
        {
          ...rest,
          ...merged,
          context,
          error: { ...error, stack: error.stack },
        },
        message,
      )
    }

    return this.logger[level]?.({ context, ...merged, ...rest }, message)
  }

  private formatInput(input: ScopedLogInput): LogInput {
    const history = input.action
      ? (this.action ?? undefined)
      : (this.action?.slice(0, -1) ?? undefined)
    const action = input.action ?? this.action?.at(-1) ?? ""

    let ctx =
      !!this.context || !!input.context
        ? { ...this.context, ...input.context }
        : undefined

    try {
      // Stringify returns undefined if ctx is `undefined`.
      const stringified = JSON.stringify(ctx) as string | undefined

      // If size greater than 200kB, remove the context to make sure
      // that the log line is still written

      // Based on empirical testing, a log line exceeding 262118 characters
      // results in it being broken into multiple lines, leading to malformed JSON.
      // To account for extra values such as the message, action, history, ECS metadata etc.
      // We limit the context to 200,000 characters.

      if (stringified && stringified.length > 2e5) {
        ctx = { logger: "[Context removed]" }
        this.logger.warn(
          {
            action,
            history,
            context: {
              size: stringified.length,
            },
          },
          "Log context is too large",
        )
        for (let i = 0; i < stringified.length; i += 2e5) {
          this.logger.warn(
            {
              action,
              history,
              context: {
                chunk: Math.floor(i / 2e5) + 1,
                chunks: Math.floor(stringified.length / 2e5) + 1,
                data: stringified.slice(
                  i,
                  Math.min(stringified.length, i + 2e5),
                ),
              },
            },
            `Removed context`,
          )
        }
      }
    } catch {
      ctx = { logger: "[Context removed]" }
      this.logger.error(
        {
          action,
          history,
        },
        "Failed to parse log context",
      )
    }

    return {
      ...input,
      action,
      history,
      context: ctx,
    }
  }
}

export const createBaseLogger = (options: {
  path: string
  nodeEnv: string
  appEnvLabel: string
  logLevel?: string
  destination?: DestinationStream
  clientIp?: string
  traceId?: string
}): CustomLogger => {
  return CustomLogger.getInstance(options)
}

export type Logger = BasicLogger & LoggerInterface
export type ScopedLogger = LoggerInterface<ScopedLogInput>
