import type { Logger } from "pino"
import { nanoid } from "nanoid"

export interface CreateChildLoggerOptions {
  path: string
  clientIp?: string
  traceId?: string
}

export function createChildLogger(
  parent: Logger<string>,
  childOptions: CreateChildLoggerOptions,
): Logger<string> {
  return parent.child({
    path: childOptions.path,
    clientIp: childOptions.clientIp,
    id: nanoid<string>(),
    trace_id: childOptions.traceId,
  })
}
