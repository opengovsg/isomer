import type { RawBuilder } from "kysely"
import type { Tagged } from "type-fest"
import { sql } from "kysely"

// Create a jsonb object from a plain object.
export function jsonb<T>(value: T): RawBuilder<Tagged<T, "JSONB">> {
  return sql`CAST(${JSON.stringify(value)} AS JSONB)`
}
