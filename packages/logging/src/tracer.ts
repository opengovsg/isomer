import tracer from "dd-trace"

import { env } from "./env"

export const initTracer = ({ service }: { service?: string } = {}) => {
  if (!service) {
    return
  }
  tracer.init({
    service,
    env: env.NEXT_PUBLIC_APP_ENV,
    version: env.NEXT_PUBLIC_APP_VERSION,
    runtimeMetrics: true,
    logInjection: true,
    profiling:
      env.NEXT_PUBLIC_APP_ENV !== "development" &&
      env.NEXT_PUBLIC_APP_ENV !== "test",
  })
}
