import { AbilityBuilder, createMongoAbility } from "@casl/ability"

import type { PermissionsProps, ResourceAbility } from "./permissions.type"
import { db } from "../database"
import { buildPermissionsFor } from "./permissions.util"

// NOTE: Fetches roles for the given resource
// and returns the permissions wihch the user has for the given resource.
// If the resourceId is `null` or `undefined`,
// we will instead fetch the roles for the given site
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
