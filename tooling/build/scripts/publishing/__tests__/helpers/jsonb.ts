import type { RawBuilder } from "kysely"

import { sql } from "@isomer/db"

// Mirror of studio's `jsonb` helper
// (apps/studio/src/server/modules/database/utils.ts): wraps a plain JS value as
// a JSONB literal so it can be inserted into JSONB columns via Kysely.
export const jsonb = <T>(value: T): RawBuilder<T> =>
  sql`CAST(${JSON.stringify(value)} AS JSONB)`
