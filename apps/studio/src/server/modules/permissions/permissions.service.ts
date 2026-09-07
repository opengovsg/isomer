/* oxlint-disable typescript/no-confusing-void-expression, anti-slop/no-unknown-parameters, eslint/array-callback-return, typescript/await-thenable, unicorn/prefer-ternary -- server lint cleanup */
import type { IsomerAdminRole } from "~prisma/generated/generatedEnums"
import { AbilityBuilder, createMongoAbility } from "@casl/ability"
import { TRPCError } from "@trpc/server"
import { get, partition } from "lodash-es"
import { isDefinedNumber } from "~/utils/truthiness"
import { AuditLogEvent, RoleType } from "~prisma/generated/generatedEnums"

import type {
  BulkPermissionsProps,
  CrudResourceActions,
  PermissionsProps,
  ResourceAbility,
  SiteAbility,
  UserManagementActions,
} from "./permissions.type"
import { logPermissionEvent } from "../audit/audit.service"
import { PG_ERROR_CODES } from "../database/constants"
import { db } from "../database/database"
import { CRUD_ACTIONS } from "./permissions.type"
import {
  buildPermissionsForResource,
  buildUserManagementPermissions,
} from "./permissions.util"

export const isActiveIsomerAdmin = async (
  userId: string,
  roles?: IsomerAdminRole[],
): Promise<boolean> => {
  const now = new Date()
  let query = db
    .selectFrom("IsomerAdmin")
    .where("userId", "=", userId)
    .where((eb) => eb.or([eb("expiry", "is", null), eb("expiry", ">", now)]))

  if (roles !== undefined && roles.length > 0) {
    query = query.where("role", "in", roles)
  }

  const result = await query.select("id").executeTakeFirst()
  return result !== undefined
}

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
    .where("deletedAt", "is", null)

  if (isDefinedNumber(resourceId)) {
    query = query.where("resourceId", "=", resourceId)
  } else {
    query = query.where("resourceId", "is", null)
  }

  const roles = await query.select("role").execute()

  for (const { role } of roles) {
    buildPermissionsForResource(role, builder)
  }

  const isUserIsomerAdmin = await isActiveIsomerAdmin(userId)

  if (isUserIsomerAdmin) {
    buildPermissionsForResource(RoleType.Admin, builder)
  }

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
    .where("deletedAt", "is", null)
    .select("role")
    .execute()
  const isUserIsomerAdmin = await isActiveIsomerAdmin(userId)

  // NOTE: Any role should be able to read site
  if (roles.length > 0 || isUserIsomerAdmin) {
    builder.can("read", "Site")
  }

  if (roles.some(({ role }) => role === RoleType.Admin) || isUserIsomerAdmin) {
    for (const action of CRUD_ACTIONS) {
      builder.can(action, "Site")
    }
  }

  return builder.build({ detectSubjectType: () => "Site" })
}

// We do bulk validation to reduce the number of DB queries: currently at max. 1-2 queries
// Deferred: this is using site wide permissions for now
// we should fetch the oldest `parent` of this resource eventually
interface BulkValidateUserPermissionsForResourcesProps extends BulkPermissionsProps {
  action: CrudResourceActions | "publish"
}
export const bulkValidateUserPermissionsForResources = async ({
  action,
  siteId,
  resourceIds,
  userId,
}: BulkValidateUserPermissionsForResourcesProps) => {
  const generateResources = async (
    requestedResourceIds: NonNullable<BulkPermissionsProps["resourceIds"]>,
  ): Promise<{ parentId: string | null }[]> => {
    if (requestedResourceIds.length === 0) {
      return [{ parentId: null }]
    }

    if (action === "create") {
      // NOTE: If this is at root, we will always use `null` as the parent
      // otherwise, this is a `create` action and the parent of the resource that
      // we want to create is the resource passed in.
      // However, because we don't have root level permissions for now,
      // we will pass in `null` to signify the site level permissions
      return requestedResourceIds.map((resourceId) => ({
        parentId: resourceId,
      }))
    }

    const [nullResourceIds, nonNullResourceIds] = partition(
      requestedResourceIds,
      (resourceId) => resourceId === null,
    )

    let resources: { parentId: string | null }[] = []

    if (nonNullResourceIds.length > 0) {
      resources = await db
        .selectFrom("Resource")
        .where("siteId", "=", siteId)
        .where("id", "in", nonNullResourceIds)
        .select(["Resource.parentId"])
        .execute()

      if (nonNullResourceIds.length !== resources.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            resourceIds.length === 1
              ? "Resource not found"
              : "Resources not found",
        })
      }
    }

    return [...resources, ...nullResourceIds.map(() => ({ parentId: null }))]
  }

  // This executes 1 DB query
  // NOTE: not passing in resourceIds because we are using site-wide permissions
  const [perms, resources] = await Promise.all([
    definePermissionsForResource({ siteId, userId }),
    generateResources(resourceIds ?? []),
  ])

  await Promise.all(
    resources.map((resource) => {
      if (perms.cannot(action, resource)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        })
      }
    }),
  )
}

export const getResourcePermission = async ({
  userId,
  siteId,
  resourceId: _resourceId,
}: PermissionsProps) => {
  let query = db
    .selectFrom("ResourcePermission")
    .where("userId", "=", userId)
    .where("siteId", "=", siteId)
    .where("deletedAt", "is", null)

  // NOTE: we are using site-wide permissions for now
  // because there's no granular resource role
  query = query.where("resourceId", "is", null)

  const roles = await query.select("role").execute()
  const isUserIsomerAdmin = await isActiveIsomerAdmin(userId)

  // Isomer admins have implicit Admin role on any site regardless of any
  // explicit roles they have on the site
  if (isUserIsomerAdmin) {
    return [{ role: RoleType.Admin }]
  }

  return roles
}

export const validatePermissionsForManagingUsers = async ({
  siteId,
  userId,
  action,
}: Omit<PermissionsProps, "resourceId"> & {
  action: UserManagementActions
}) => {
  const roles = await getResourcePermission({ siteId, userId })
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
      .selectFrom("ResourcePermission")
      .where("userId", "=", userId)
      .where("siteId", "=", siteId)
      .where("resourceId", "is", null)
      // because we are updating site-wide permissions
      .where("deletedAt", "is", null)
      // ensure deleted persmission deletedAt is not overwritten
      .selectAll()
      .executeTakeFirst()

    if (!sitePermissionToRemove) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User permission not found",
      })
    }

    const deletedSitePermission = await tx
      .updateTable("ResourcePermission")
      .where("id", "=", sitePermissionToRemove.id)
      .set({ deletedAt: new Date() })
      // soft delete the old permission
      .returningAll()
      .executeTakeFirst()

    // NOTE: this is technically impossible because we're executing
    // inside a tx and this is the same resource which was fetched earlier
    if (!deletedSitePermission) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          "Something went wrong while updating user permissions, please try again later",
      })
    }

    await logPermissionEvent(tx, {
      by: byUser,
      delta: { after: deletedSitePermission, before: sitePermissionToRemove },
      eventType: AuditLogEvent.PermissionDelete,
      siteId,
    })

    const createdSitePermission = await tx
      .insertInto("ResourcePermission")
      .values({ resourceId: null, role, siteId, userId })
      // because we are updating site-wide permissions
      .returningAll()
      .executeTakeFirstOrThrow()
      .catch((error: unknown) => {
        if (get(error, "code") === PG_ERROR_CODES.uniqueViolation) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Permission already exists",
          })
        }
        throw error
      })

    await logPermissionEvent(tx, {
      by: byUser,
      delta: { after: createdSitePermission, before: null },
      eventType: AuditLogEvent.PermissionCreate,
      siteId,
    })

    return createdSitePermission
  })
}

interface ValidateUserIsIsomerAdminProps {
  userId: string
  roles: IsomerAdminRole[]
}

export const validateUserIsIsomerAdmin = async ({
  userId,
  roles,
}: ValidateUserIsIsomerAdminProps) => {
  const isAdmin = await isActiveIsomerAdmin(userId, roles)

  if (!isAdmin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have sufficient permissions to perform this action",
    })
  }
}

interface ValidateUserIsSiteAdminProps {
  userId: string
  siteId: number
}
export const validateUserIsSiteAdmin = async ({
  userId,
  siteId,
}: ValidateUserIsSiteAdminProps) => {
  // Use the shared permission lookup so platform-level Isomer Admins inherit
  // every capability guarded as Site Admin-only. This also keeps expiry and
  // soft-deletion handling consistent with the rest of the permission system.
  const roles = await getResourcePermission({ siteId, userId })

  if (!roles.some(({ role }) => role === RoleType.Admin)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have sufficient permissions to perform this action",
    })
  }

  return true
}
