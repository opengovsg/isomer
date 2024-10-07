import { AbilityBuilder, createMongoAbility } from "@casl/ability"
import { TRPCError } from "@trpc/server"

import type {
  CrudResourceActions,
  PermissionsProps,
  ResourceAbility,
} from "./permissions.type"
import { db } from "../database"
import { buildPermissionsForResource } from "./permissions.util"

// NOTE: Fetches roles for the given resource
// and returns the permissions wihch the user has for the given resource.
// If the resourceId is `null` or `undefined`,
// we will instead fetch the roles for the given site
export const definePermissionsForResource = async ({
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

  roles.map(({ role }) => buildPermissionsForResource(role, builder))

  return builder.build({ detectSubjectType: () => "Resource" })
}

export const validateUserPermissionsForResource = async ({
  action,
  resourceId = null,
  ...rest
}: PermissionsProps & { action: CrudResourceActions }) => {
  // TODO: this is using site wide permissions for now
  // we should fetch the oldest `parent` of this resource eventually
  const hasCustomParentId = resourceId === null || action === "create"
  const resource = hasCustomParentId
    ? // NOTE: If this is at root, we will always use `null` as the parent
      // otherwise, this is a `create` action and the parent of the resource that
      // we want to create is the resource passed in.
      // However, because we don't have root level permissions for now,
      // we will pass in `null` to signify the site level permissions
      { parentId: resourceId ?? null }
    : await db
        .selectFrom("Resource")
        .where("Resource.id", "=", resourceId)
        .select(["Resource.parentId"])
        .executeTakeFirstOrThrow()

  const perms = await definePermissionsForResource({
    ...rest,
  })

  // TODO: create should check against the current resource id
  if (perms.cannot(action, resource)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have sufficient permissions to perform this action",
    })
  }
}
