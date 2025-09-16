import { Cluster, Redis } from "ioredis";
import Redlock from "redlock";
import { env } from "./env";

/* Wrapper type that ties a Redis client and Redlock instance to a specific keyspace. */
export interface RedisWithRedlock {
  redis: Redis | Cluster;
  redlock: Redlock;
  keyspace: string;
}

/* Singleton pattern using global for dev hot reload */
const globalForRedis = global as unknown as {
  redisClients: Record<string, Redis | Cluster>;
  redlockClients: Record<string, Redlock>;
};

const createRedisClient = (keyspace: string) => {
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
            keyPrefix: `${keyspace}:`,
          },
        })
      : // in development or testing just use same docker instance for convenience
        new Redis(env.REDIS_URL, {
          maxRetriesPerRequest: null,
          keyPrefix: `${keyspace}:`,
        });

  RedisClient.on("error", (err) => console.error("Redis client error", err));

  return RedisClient;
};

const getRedisClient = (keyspace: string): Redis | Cluster => {
  const client =
    globalForRedis.redisClients[keyspace] ?? createRedisClient(keyspace);
  globalForRedis.redisClients[keyspace] = client;
  return client;
};

const getRedlockClient = (keyspace: string): Redlock => {
  const client =
    globalForRedis.redlockClients[keyspace] ??
    new Redlock([getRedisClient(keyspace)], { retryCount: 0 });
  globalForRedis.redlockClients[keyspace] = client;
  return client;
};

/**
 * Get a Redis client and a Redlock instance for a specific keyspace.
 * @param keyspace A string to prefix all Redis keys with, to avoid collisions between different parts of the app.
 * @returns An object containing the Redis client, Redlock instance, and keyspace.
 */
export const getRedisWithRedlock = (keyspace: string): RedisWithRedlock => {
  return {
    redis: getRedisClient(keyspace),
    redlock: getRedlockClient(keyspace),
    keyspace,
  };
};

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
globalForRedis.redisClients ||= {};

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
globalForRedis.redlockClients ||= {};
