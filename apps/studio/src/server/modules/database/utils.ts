import type { Expression, RawBuilder, Simplify } from "kysely"
import type { Tagged } from "type-fest"
import { sql } from "kysely"
import { jsonArrayFrom } from "kysely/helpers/postgres"

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

// Create a jsonb object from a plain object.
export function jsonb<T>(value: T): RawBuilder<Tagged<T, "JSONB">> {
  return sql`CAST(${JSON.stringify(value)} AS JSONB)`
}

export function integer(value: number): RawBuilder<number> {
  return sql`CAST(${value} AS INTEGER)`
}
