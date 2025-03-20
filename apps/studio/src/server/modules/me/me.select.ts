import type { SelectExpression } from "kysely"

import type { DB } from "../database"

/**
 * Default selector for when retrieving logged in user.
 * It's important to always explicitly say which fields you want to return in order to not leak extra information
 * @see https://github.com/prisma/prisma/issues/9353
 */
export const defaultUserSelect = [
  "id",
  "email",
  "name",
  "phone",
  "createdAt",
] satisfies SelectExpression<DB, "User">[]
