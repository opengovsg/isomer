import tracer from "dd-trace"

import { env } from "~/env.mjs"

// initialized in a different file to avoid hoisting.
tracer.init({
  service: "isomer-next",
  env: env.NEXT_PUBLIC_APP_ENV,
  version: env.NEXT_PUBLIC_APP_VERSION,
  runtimeMetrics: true,
  logInjection: true,
})
export default tracer
