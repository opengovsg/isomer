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
    logInjection: true,
    runtimeMetrics: true,
    reportHostname: true,
    profiling: process.env.NODE_ENV === "production",
  })
}
