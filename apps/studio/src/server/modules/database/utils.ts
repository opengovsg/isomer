import type {
  Expression,
  Kysely,
  RawBuilder,
  Simplify,
  Transaction,
} from "kysely"
import { sql } from "kysely"
import { type DrainOuterGeneric } from "kysely/dist/cjs/util/type-utils"
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres"
import { type Tagged } from "type-fest"

import type { DB } from "./types"

export type DateTimeString = Tagged<string, "DateTimeString">

type CastDateTimesToStrings<O> = {
  [K in keyof O]: O[K] extends Date
    ? DateTimeString
    : [Date] extends [O[K]]
      ? DateTimeString | null // Kysely should only return null and not undefined types.
      : O[K]
}

// https://github.com/kysely-org/kysely/issues/482
export function typesafeJsonArrayFrom<O>(
  expr: Expression<O>,
): RawBuilder<CastDateTimesToStrings<Simplify<O>>[]> {
  // @ts-expect-error #TS2322
  return jsonArrayFrom(expr)
}

export function typesafeJsonObjectFrom<O>(
  expr: Expression<O>,
): RawBuilder<CastDateTimesToStrings<
  DrainOuterGeneric<{
    [K in keyof O]: O[K]
  }>
> | null> {
  // @ts-expect-error #TS2322
  return jsonObjectFrom(expr)
}

/**
 * To be used when we are sure the object will exist.
 *
 * Difference from `typesafeJsonObjectFrom` is returned object type is casted to non-nullable.
 */
export function typesafeJsonObjectFromStrict<O>(
  expr: Expression<O>,
): RawBuilder<
  CastDateTimesToStrings<
    DrainOuterGeneric<{
      [K in keyof O]: O[K]
    }>
  >
> {
  // @ts-expect-error #TS2322
  return jsonObjectFrom(expr)
}

// Create a jsonb object from a plain object.
export function jsonb<T>(value: T): RawBuilder<Tagged<T, "JSONB">> {
  return sql`CAST(${JSON.stringify(value)} AS JSONB)`
}

export function integer(value: number): RawBuilder<number> {
  return sql`CAST(${value} AS INTEGER)`
}

/**
 * Adds transaction with retry logic for transient errors like serialization failures and deadlocks.
 * @param db  DB instance
 * @param fn  Function to execute within the transaction
 * @param param2  Additional parameters for the function
 * @returns  Result of the function execution
 */
export const withTransactionRetry = async <T>(
  db: Kysely<DB>,
  fn: (tx: Transaction<DB>) => Promise<T>,
  {
    maxAttempts = 5,
    baseDelayMs = 100,
    maxDelayMs = 2000,
    jitter = true,
  }: {
    maxAttempts?: number
    baseDelayMs?: number
    maxDelayMs?: number
    jitter?: boolean
  } = {},
): Promise<T> => {
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
  let attempt = 0
  while (true) {
    attempt++
    try {
      return await db.transaction().execute(fn)
    } catch (err) {
      if (attempt < maxAttempts) {
        // Exponential backoff with optional jitter
        let delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs)
        if (jitter) {
          // Random between 50% and 100% of delay
          delay = delay / 2 + Math.random() * (delay / 2)
        }
        await sleep(delay)
        continue
      }
      throw err
    }
  }
}
