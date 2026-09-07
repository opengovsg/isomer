// NOTE: See here for the full list of pg err codes
// https://github.com/postgres/postgres/blob/master/src/backend/utils/errcodes.txt
export const PG_ERROR_CODES = {
  // A statement aborted while waiting for a lock (e.g. lock_timeout fired).
  lockTimeout: "55P03",
  serializationFailure: "40001",
  uniqueViolation: "23505",
} as const
