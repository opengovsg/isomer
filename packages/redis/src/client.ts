import { Cluster, Redis } from "ioredis";
import Redlock from "redlock";
import { env } from "./env";

/* Wrapper type that ties a Redis client and Redlock instance to a specific keyspace. */
export interface RedisWithRedlock {
  redis: Redis | Cluster;
  redlock: Redlock;
}

/* Singleton pattern using global for dev hot reload */
const globalForRedis = global as unknown as {
  redisClients: Record<string, Redis | Cluster>;
  redlockClients: Record<string, Redlock>;
};

/**
 * Create a Redis client for a specific keyspace.
 * NOTE: The key MUST be empty string "" if using with bullmq, as bullmq uses its own key prefixing scheme
 * https://docs.bullmq.io/guide/connections
 * @param keyspace A string to prefix all Redis keys with, to avoid collisions between different parts of the app.
 * @returns A Redis client instance.
 */
const createRedisClient = (keyspace: string) => {
  const RedisClient: Redis | Cluster =
    env.NODE_ENV === "production"
      ? // MemoryDB cluster in deployed envs
        new Cluster([{ host: env.REDIS_HOST, port: env.REDIS_PORT }], {
          // To prevent errors with invalid certs: https://github.com/redis/ioredis?tab=readme-ov-file#special-note-aws-elasticache-clusters-with-tls
          dnsLookup: (address, callback) => callback(null, address),
          redisOptions: {
            tls: {},
            maxRetriesPerRequest: null,
            keyPrefix: !!keyspace ? `${keyspace}:` : undefined,
          },
        })
      : // in development or testing just use same docker instance for convenience
        new Redis(env.REDIS_URL, {
          maxRetriesPerRequest: null,
          keyPrefix: !!keyspace ? `${keyspace}:` : undefined,
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

interface RedisAndRedlockBullmqCompatibleOptions {
  bullmqCompatible: true;
}

interface RedisAndRedlockCustomKeyspaceOptions {
  bullmqCompatible: false;
  keyspace: string;
}

/**
 * Options for getRedisWithRedlock function.
 * If bullmqCompatible is true, the keyspace will be set to "" to be compatible with bullmq.
 * If bullmqCompatible is false, a custom non-empty keyspace must be provided.
 */
type RedisAndRedlockOptions =
  | RedisAndRedlockBullmqCompatibleOptions
  | RedisAndRedlockCustomKeyspaceOptions;

/**
 * Get a Redis client and a Redlock instance for a specific keyspace.
 * @param keyspace A string to prefix all Redis keys with, to avoid collisions between different parts of the app.
 * NOTE: The key is not considered when bullmqCompatible is true as bullmq uses its own key prefixing scheme
 * Passing an empty string "" uses the default non-key-prefixed namespace
 * https://docs.bullmq.io/guide/connections
 * @returns An object containing the Redis client, Redlock instance, and keyspace.
 */
export const getRedisWithRedlock = (
  options: RedisAndRedlockOptions
): RedisWithRedlock => {
  return {
    redis: getRedisClient(options.bullmqCompatible ? "" : options.keyspace),
    redlock: getRedlockClient(options.bullmqCompatible ? "" : options.keyspace),
  };
};

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
globalForRedis.redisClients ||= {};

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
globalForRedis.redlockClients ||= {};
