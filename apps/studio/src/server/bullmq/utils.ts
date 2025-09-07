import type { Worker } from "bullmq"
import type pino from "pino"

import { WORKER_SHUTDOWN_TIMEOUT } from "./queues"

/**
 * Gracefully shuts down the worker on receiving termination signals. Shut down the worker
 * within WORKER_SHUTDOWN_TIMEOUT, else force exit.
 * @param signal The signal received (e.g., 'SIGINT', 'SIGTERM')
 * @returns A promise that resolves when the worker has shut down or rejects on timeout.
 */
const gracefulShutdown = async (
  worker: Worker,
  logger: pino.Logger<string>,
  signal: string,
) => {
  logger.info({ message: `Received ${signal}, shutting down worker...` })
  try {
    await Promise.race([
      worker.close(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Worker shutdown timeout")),
          WORKER_SHUTDOWN_TIMEOUT,
        ),
      ),
    ])
    logger.info({ message: "Worker shut down cleanly" })
    process.exit(0)
  } catch (err) {
    logger.error({ err }, "Error during graceful shutdown")
    process.exit(1)
  }
}

/**
 * Handle termination signals and gracefully shut down the worker.
 * @param worker The BullMQ worker to shut down
 * @param logger The logger instance
 * @param signal The termination signal received
 */
export const handleSignal = (
  worker: Worker,
  logger: pino.Logger<string>,
  signal: string,
) => {
  gracefulShutdown(worker, logger, signal).catch((err: unknown) => {
    logger.error({ err }, "Unhandled error during shutdown")
    process.exit(1)
  })
}
