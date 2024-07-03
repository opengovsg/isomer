import type { DestinationStream } from "pino";
import { env } from "@isomer/env";
import { nanoid } from "nanoid";
import { pino } from "pino";
import pretty from "pino-pretty";

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
};

interface LoggerOptions {
  path: string;
  clientIp?: string;
}

export class PinoLogger {
  private static instance: pino.Logger<string> | undefined;
  private static getInstance() {
    if (!PinoLogger.instance)
      PinoLogger.instance = PinoLogger.createBaseLogger();
    return PinoLogger.instance;
  }
  private static createBaseLogger = (): pino.Logger<string> => {
    let transport: ReturnType<typeof pino.destination> | DestinationStream;
    if (env.NODE_ENV === "development" || env.NODE_ENV === "test") {
      transport = pretty({
        colorize: true,
        hideObject: false,
        messageKey: "message",
        timestampKey: "timestamp",
        messageFormat: "[{path}] {message}",
      });
    } else {
      transport = pino.destination(1);
    }
    return pino(
      {
        level: env.LOG_LEVEL,
        customLevels: levels,
        useOnlyCustomLevels: true,
        timestamp: () => `,"timestamp":"${new Date(Date.now()).toISOString()}"`,
        formatters: {
          bindings: (bindings) => {
            return {
              env: env.NODE_ENV,
              ...bindings,
            };
          },
          level: (label) => {
            return { level: label.toUpperCase() };
          },
        },
      },
      transport,
    );
  };
  /*
  The logger we use inherits the bindings and transport from the parent singleton instance
  Use child loggers to avoid creating a new instance for every trpc call
  */
  public static logger = ({ path, clientIp }: LoggerOptions) => {
    return PinoLogger.getInstance().child({
      path,
      clientIp,
      id: nanoid(),
    });
  };
}

export const createBaseLogger = PinoLogger.logger;
