import { AbilityBuilder, createMongoAbility } from "@casl/ability"
import { RoleType } from "@prisma/client"
import { TRPCError } from "@trpc/server"
import { AuditLogEvent } from "~prisma/generated/generatedEnums"

import type {
  CrudResourceActions,
  PermissionsProps,
  ResourceAbility,
  SiteAbility,
  UserManagementActions,
} from "./permissions.type"
import { logPermissionEvent } from "../audit/audit.service"
import { db } from "../database"
import { CRUD_ACTIONS } from "./permissions.type"
import {
  buildPermissionsForResource,
  buildUserManagementPermissions,
} from "./permissions.util"

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

  const roles = await query.select("role").execute()

  roles.map(({ role }) => buildPermissionsForResource(role, builder))

  return builder.build({ detectSubjectType: () => "Resource" })
}

export const definePermissionsForSite = async ({
  userId,
  siteId,
}: Omit<PermissionsProps, "resourceId">) => {
  const builder = new AbilityBuilder<SiteAbility>(createMongoAbility)
  const roles = await db
    .selectFrom("ResourcePermission")
    .where("userId", "=", userId)
    .where("siteId", "=", siteId)
    .where("resourceId", "is", null)
    .select("role")
    .execute()

  // NOTE: Any role should be able to read site
  if (roles.length === 1) {
    builder.can("read", "Site")
  }

  if (roles.some(({ role }) => role === RoleType.Admin)) {
    CRUD_ACTIONS.map((action) => {
      builder.can(action, "Site")
    })
  }

  return builder.build({ detectSubjectType: () => "Site" })
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
        .executeTakeFirst()

  if (!resource) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Resource not found",
    })
  }

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

export const getSitePermissions = async ({
  userId,
  siteId,
}: Omit<PermissionsProps, "resourceId">) => {
  return await db
    .selectFrom("ResourcePermission")
    .where("userId", "=", userId)
    .where("siteId", "=", siteId)
    .where("resourceId", "is", null)
    .select("role")
    .execute()
}

export const validatePermissionsForManagingUsers = async ({
  siteId,
  userId,
  action,
}: Omit<PermissionsProps, "resourceId"> & {
  action: UserManagementActions
}) => {
  const roles = await getSitePermissions({ userId, siteId })
  const perms = buildUserManagementPermissions(roles)

  if (perms.cannot(action, "UserManagement")) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have sufficient permissions to perform this action",
    })
  }
}

interface UpdateUserSitewidePermissionProps {
  byUserId: string
  userId: string
  siteId: number
  role: RoleType
}

export const updateUserSitewidePermission = async ({
  byUserId,
  userId,
  siteId,
  role,
}: UpdateUserSitewidePermissionProps) => {
  // Putting outside the tx to reduce unnecessary extended DB locks
  const byUser = await db
    .selectFrom("User")
    .where("id", "=", byUserId)
    .selectAll()
    .executeTakeFirstOrThrow()

  return await db.transaction().execute(async (tx) => {
    const sitePermissionToRemove = await tx
      .deleteFrom("ResourcePermission")
      .where("userId", "=", userId)
      .where("siteId", "=", siteId)
      .where("resourceId", "is", null) // because we are updating site-wide permissions
      .returningAll()
      .executeTakeFirst()

    if (!sitePermissionToRemove) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User permission not found",
      })
    }

    await logPermissionEvent(tx, {
      eventType: AuditLogEvent.PermissionDelete,
      by: byUser,
      delta: { before: sitePermissionToRemove, after: null },
    })

    const createdSitePermission = await tx
      .insertInto("ResourcePermission")
      .values({ userId, siteId, role, resourceId: null }) // because we are updating site-wide permissions
      .returningAll()
      .executeTakeFirstOrThrow()

    await logPermissionEvent(tx, {
      eventType: AuditLogEvent.PermissionCreate,
      by: byUser,
      delta: { before: null, after: createdSitePermission },
    })

    return createdSitePermission
  })
}
