import type pino from "pino";
import { ResourceLockedError, type Lock, type Settings } from "redlock";
import type Redlock from "redlock";
import { DEFAULT_REDLOCK_TTL_MS } from "./constants";

interface RedlockOptions extends Partial<Settings> {
  lock_ttl_ms?: number; // Time to live for the lock in milliseconds
}

/**
 * Given a Redlock client, execute a function while holding a lock on a resource
 * @param client Redlock client instance
 * @param resource_name Name of the resource to lock
 * @param fn Function to execute while holding the lock
 * @param logger Logger instance for logging
 * @param lock_ttl_ms Time to live for the lock in milliseconds
 * @param opts Additional options for the lock
 * @returns
 */
export const withRedlock = async <T>(
  client: Redlock,
  resource_name: string,
  fn: () => Promise<T>,
  logger: pino.Logger<string>,
  opts?: RedlockOptions
) => {
  let lock: Lock | null = null;
  try {
    lock = await client.acquire(
      [`locks:resource:${resource_name}`],
      opts?.lock_ttl_ms ?? DEFAULT_REDLOCK_TTL_MS,
      opts
    );
    await fn();
  } catch (error) {
    // If fail to acquire the lock, log the event and return gracefully
    if (error instanceof ResourceLockedError) {
      logger.info(
        { resource_name, error },
        `Could not acquire lock for resource ${resource_name}`
      );
      return;
    }
    throw error;
  } finally {
    // Ensure the lock is released if it was acquired
    if (lock) {
      await lock.release().catch((error: Error) => {
        logger.warn(
          { resource_name, error },
          `Failed to release lock for resource ${resource_name}`
        );
      });
    }
  }
};
