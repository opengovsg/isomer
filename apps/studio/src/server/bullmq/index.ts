import { RedisClient } from "@isomer/redis"

import { createBaseLogger } from "~/lib/logger"

const logger = createBaseLogger({ path: "bullmq:index" })

RedisClient.on("connect", () => {
  logger.info({ message: "Initiating connection to Redis" })
})
RedisClient.on("ready", () => {
  logger.info({ message: "Redis Client is ready to use" })
})
RedisClient.on("end", () => {
  logger.error({ message: "Redis connection has been closed" })
})
RedisClient.on("error", (error: Error) => {
  logger.error({ message: "Redis connection error", error })
})
RedisClient.on("reconnecting", () => {
  logger.warn({ message: "Client is trying to reconnect to the server" })
})
