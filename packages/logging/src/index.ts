export type { Logger } from "pino"

export { SYSLOG_LEVELS } from "./levels"
export {
  createRootLogger,
  type CreateRootLoggerOptions,
} from "./create-root-logger"
export {
  createChildLogger,
  type CreateChildLoggerOptions,
} from "./create-child-logger"
