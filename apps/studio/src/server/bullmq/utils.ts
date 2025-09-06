import { JobsOptions } from "bullmq"
import { Cluster, Redis } from "ioredis"

import { env } from "~/env.mjs"

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
  env.NODE_ENV === "development"
    ? // in development just use same docker instance for convenience
      new Redis(REDIS_URL, { maxRetriesPerRequest: null })
    : // MemoryDB cluster in deployed envs
      new Redis.Cluster([{ host: env.REDIS_HOST, port: env.REDIS_PORT }], {
        // To prevent errors with invalid certs: https://github.com/redis/ioredis?tab=readme-ov-file#special-note-aws-elasticache-clusters-with-tls
        dnsLookup: (address, callback) => callback(null, address),
        redisOptions: {
          tls: {},
          maxRetriesPerRequest: null,
        },
      })
