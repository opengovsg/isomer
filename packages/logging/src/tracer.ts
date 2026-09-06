import tracer from "dd-trace"

import { env } from "./env"

export const initTracer = ({ service }: { service?: string } = {}) => {
  if (service === undefined || service.length === 0) {
    return
  }
  tracer.init({
    env: env.NEXT_PUBLIC_APP_ENV,
    logInjection: true,
    profiling:
      env.NEXT_PUBLIC_APP_ENV !== "development" &&
      env.NEXT_PUBLIC_APP_ENV !== "test",
    runtimeMetrics: true,
    service,
    version: env.NEXT_PUBLIC_APP_VERSION,
  })
}
