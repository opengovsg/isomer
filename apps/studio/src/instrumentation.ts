export async function register() {
  // make sure you only run on nodejs runtime or you will have errors with built-in modules not being defined
  // eslint-disable-next-line no-restricted-properties
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("Instrumenting Next.js Server")
    await import("~/server/modules/tracer")

    // Import only if runtime is nodejs. This avoids running it on the browser, build time etc.
    const { initializeCronJobs, stopCronJobs } = await import("~/server/cron")

    // Initialize cron jobs when server starts
    initializeCronJobs()

    // Handle graceful shutdown
    const gracefulShutdown = () => {
      console.log("Received shutdown signal, stopping cron jobs...")
      stopCronJobs()
      process.exit(0)
    }
    // Listen for shutdown signals
    process.on("SIGTERM", gracefulShutdown)
    process.on("SIGINT", gracefulShutdown)
  }
}
