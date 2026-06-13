export async function register() {
  // make sure you only run on nodejs runtime or you will have errors with built-in modules not being defined
  // oxlint-disable-next-line node/no-process-env
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("Instrumenting Next.js Server")

    // setup datadog tracing
    const { initTracer } = await import("@isomer/logging/tracer")
    // oxlint-disable-next-line node/no-process-env
    initTracer({ service: process.env.DD_SERVICE ?? "isomer-next" })

    // Skip cron on Vercel preview (serverless — no persistent process)
    // oxlint-disable-next-line node/no-process-env
    if (process.env.NEXT_PUBLIC_APP_ENV !== "preview") {
      // Import only if runtime is nodejs. This avoids running it on the browser, build time etc.
      const { initializeCronJobs, stopCronJobs } = await import("~/server/cron")
      await initializeCronJobs()

      const gracefulShutdown = () => {
        console.log("Received shutdown signal, stopping cron jobs...")
        stopCronJobs()
        process.exit(0)
      }
      process.on("SIGTERM", gracefulShutdown)
      process.on("SIGINT", gracefulShutdown)
    }
  }
}
