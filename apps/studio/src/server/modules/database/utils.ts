import type { Expression, RawBuilder, Simplify } from "kysely"
import { sql } from "kysely"
import { type DrainOuterGeneric } from "kysely/dist/cjs/util/type-utils"
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres"
import { type Tagged } from "type-fest"

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
