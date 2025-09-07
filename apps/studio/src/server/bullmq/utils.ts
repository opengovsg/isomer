import type { JobsOptions, Worker } from "bullmq"
import type pino from "pino"
import { Cluster, Redis } from "ioredis"
import Redlock from "redlock"

import { env } from "~/env.mjs"
import { WORKER_SHUTDOWN_TIMEOUT } from "./queues"

export const defaultOpts: JobsOptions = {
  delay: 1000,
  removeOnComplete: true,
  failParentOnFailure: true,
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 10000,
  },
}

export const REDIS_URL = `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`

/** Redis client used for BullMQ jobs, uses MemoryDB */
export const RedisClient: Redis | Cluster =
  env.NODE_ENV !== "production"
    ? // in development or testing just use same docker instance for convenience
      new Redis(REDIS_URL, { maxRetriesPerRequest: null })
    : // MemoryDB cluster in deployed envs
      new Cluster([{ host: env.REDIS_HOST, port: env.REDIS_PORT }], {
        // To prevent errors with invalid certs: https://github.com/redis/ioredis?tab=readme-ov-file#special-note-aws-elasticache-clusters-with-tls
        dnsLookup: (address, callback) => callback(null, address),
        redisOptions: {
          tls: {},
          maxRetriesPerRequest: null,
        },
      })

/**
 *  Redlock for same-page locking; ie to ensure scheduled publish
 *  doesn't run concurrently on the same page, EVEN across multiple instances
 *  Retry count is set to 0 so that if a lock cannot be acquired, it fails immediately
 */
export const redlockClient = new Redlock([RedisClient], { retryCount: 0 })

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
