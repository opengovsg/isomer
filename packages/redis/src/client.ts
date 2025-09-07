import { Cluster, Redis } from "ioredis";
import Redlock from "redlock";
import { env } from "./env";

// Singleton pattern using global for dev hot reload
const globalForRedis = global as unknown as {
  redis: Redis | Cluster;
  redlock: Redlock;
};

const createRedisClient = () => {
  /** Redis client used for BullMQ jobs */
  const RedisClient: Redis | Cluster =
    env.NODE_ENV === "production"
      ? // MemoryDB cluster in deployed envs
        new Cluster([{ host: env.REDIS_HOST, port: env.REDIS_PORT }], {
          // To prevent errors with invalid certs: https://github.com/redis/ioredis?tab=readme-ov-file#special-note-aws-elasticache-clusters-with-tls
          dnsLookup: (address, callback) => callback(null, address),
          redisOptions: {
            tls: {},
            maxRetriesPerRequest: null,
          },
        })
      : // in development or testing just use same docker instance for convenience
        new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

  RedisClient.on("error", (err) => console.error("Redis client error", err));

  return RedisClient;
};

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
export const RedisClient = globalForRedis.redis || createRedisClient();
// To ensure we don't create new clients in dev on every file change
if (env.NODE_ENV !== "production") globalForRedis.redis = RedisClient;

// Redlock for distributed locking
export const RedlockClient =
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  globalForRedis.redlock || new Redlock([RedisClient], { retryCount: 0 });
if (env.NODE_ENV !== "production") globalForRedis.redlock = RedlockClient;
