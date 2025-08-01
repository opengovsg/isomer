import type { GrowthBook } from "@growthbook/growthbook"
import { AbilityBuilder, createMongoAbility } from "@casl/ability"
import { RoleType } from "@prisma/client"
import { TRPCError } from "@trpc/server"
import get from "lodash/get"
import partition from "lodash/partition"

import type {
  BulkPermissionsProps,
  CrudResourceActions,
  PermissionsProps,
  ResourceAbility,
  SiteAbility,
  UserManagementActions,
} from "./permissions.type"
import type { GrowthbookIsomerAdminFeature } from "~/lib/growthbook"
import { ADMIN_ROLE, ISOMER_ADMIN_FEATURE_KEY } from "~/lib/growthbook"
import { logPermissionEvent } from "../audit/audit.service"
import { db } from "../database"
import { PG_ERROR_CODES } from "../database/constants"
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
    .where("deletedAt", "is", null)

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
    .where("deletedAt", "is", null)
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

// We do bulk validation to reduce the number of DB queries: currently at max. 1-2 queries
// TODO: this is using site wide permissions for now
// we should fetch the oldest `parent` of this resource eventually
interface BulkValidateUserPermissionsForResourcesProps
  extends BulkPermissionsProps {
  action: CrudResourceActions | "publish"
}
export const bulkValidateUserPermissionsForResources = async ({
  action,
  siteId,
  resourceIds,
  userId,
}: BulkValidateUserPermissionsForResourcesProps) => {
  const generateResources = async (
    resourceIds: NonNullable<BulkPermissionsProps["resourceIds"]>,
  ): Promise<{ parentId: string | null }[]> => {
    if (resourceIds.length === 0) {
      return [{ parentId: null }]
    }

    if (action === "create") {
      // NOTE: If this is at root, we will always use `null` as the parent
      // otherwise, this is a `create` action and the parent of the resource that
      // we want to create is the resource passed in.
      // However, because we don't have root level permissions for now,
      // we will pass in `null` to signify the site level permissions
      return resourceIds.map((resourceId) => ({ parentId: resourceId }))
    }

    const [nullResourceIds, nonNullResourceIds] = partition(
      resourceIds,
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

    return resources.concat(nullResourceIds.map(() => ({ parentId: null })))
  }

  // This executes 1 DB query
  // NOTE: not passing in resourceIds because we are using site-wide permissions
  const perms = await definePermissionsForResource({ siteId, userId })

  // This executes 0-1 DB query
  const resources = await generateResources(resourceIds ?? [])

  await Promise.all(
    resources.map((resource) => {
      if (perms.cannot(action, resource)) {
        return Promise.reject(
          new TRPCError({
            code: "FORBIDDEN",
            message:
              "You do not have sufficient permissions to perform this action",
          }),
        )
      }
      return Promise.resolve()
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

  return query.select("role").execute()
}

export const validatePermissionsForManagingUsers = async ({
  siteId,
  userId,
  action,
}: Omit<PermissionsProps, "resourceId"> & {
  action: UserManagementActions
}) => {
  const roles = await getResourcePermission({ userId, siteId })
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
      .where("resourceId", "is", null) // because we are updating site-wide permissions
      .where("deletedAt", "is", null) // ensure deleted persmission deletedAt is not overwritten
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
      .set({ deletedAt: new Date() }) // soft delete the old permission
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
      eventType: "PermissionDelete",
      by: byUser,
      delta: { before: sitePermissionToRemove, after: deletedSitePermission },
    })

    const createdSitePermission = await tx
      .insertInto("ResourcePermission")
      .values({ userId, siteId, role, resourceId: null }) // because we are updating site-wide permissions
      .returningAll()
      .executeTakeFirstOrThrow()
      .catch((err) => {
        if (get(err, "code") === PG_ERROR_CODES.uniqueViolation) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Permission already exists",
          })
        }
        throw err
      })

    await logPermissionEvent(tx, {
      eventType: "PermissionCreate",
      by: byUser,
      delta: { before: null, after: createdSitePermission },
    })

    return createdSitePermission
  })
}

interface ValidateUserIsIsomerAdminProps {
  userId: string
  gb: GrowthBook
  roles: (typeof ADMIN_ROLE)[keyof typeof ADMIN_ROLE][]
}

export const validateUserIsIsomerCoreAdmin = async ({
  userId,
  gb,
  roles,
}: ValidateUserIsIsomerAdminProps) => {
  const user = await db
    .selectFrom("User")
    .where("id", "=", userId)
    .where("deletedAt", "is", null)
    .select(["email"])
    .executeTakeFirstOrThrow()

  const { core, migrators } = gb.getFeatureValue<GrowthbookIsomerAdminFeature>(
    ISOMER_ADMIN_FEATURE_KEY,
    { core: [], migrators: [] },
  )

  if (roles.includes(ADMIN_ROLE.CORE) && core.includes(user.email)) {
    return
  }

  if (roles.includes(ADMIN_ROLE.MIGRATORS) && migrators.includes(user.email)) {
    return
  }

  throw new TRPCError({
    code: "FORBIDDEN",
    message: "You do not have sufficient permissions to perform this action",
  })
}
