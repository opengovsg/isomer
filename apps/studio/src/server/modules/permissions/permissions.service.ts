import { AbilityBuilder, createMongoAbility } from "@casl/ability"

import type { PermissionsProps, ResourceAbility } from "./permissions.type"
import { db } from "../database"
import { buildPermissionsFor } from "./permissions.util"

export const definePermissionsFor = async ({
  userId,
  siteId,
  resourceId,
}: PermissionsProps) => {
  const builder = new AbilityBuilder<ResourceAbility>(createMongoAbility)
  let query = db
    .selectFrom("ResourcePermission")
    .where("userId", "=", userId)
    .where("siteId", "=", siteId)

  if (!resourceId) {
    query = query.where("resourceId", "is", null)
  } else {
    query = query.where("resourceId", "=", resourceId)
  }

  const roles = await query.selectAll().execute()

  roles.map(({ role }) => buildPermissionsFor(role, builder))

  return builder.build({ detectSubjectType: () => "Resource" })
}
