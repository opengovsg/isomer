import type { Ability } from "@casl/ability"

import type { Resource as RawResource, Site } from "../database"

type Resource = Pick<RawResource, "parentId">

export const CRUD_ACTIONS = ["create", "read", "update", "delete"] as const
type AllowedResourceActions = (typeof ALL_ACTIONS)[number]
export type CrudResourceActions = (typeof CRUD_ACTIONS)[number]
type Subjects = "Resource" | Resource

export const ALL_ACTIONS = [...CRUD_ACTIONS, "move", "publish"] as const
type ResourcePermissionTuple = [AllowedResourceActions, Subjects]
export type ResourceAbility = Ability<ResourcePermissionTuple>

type SitePermissionTuple = [CrudResourceActions, "Site"]
export type SiteAbility = Ability<SitePermissionTuple>

// Only 2 actions are allowed for UserManagement
// because Admins can update, delete and create users
const _USER_MANAGEMENT_ACTIONS = ["read", "manage"] as const
export type UserManagementActions = (typeof _USER_MANAGEMENT_ACTIONS)[number]
type UserManagementTuple = [UserManagementActions, "UserManagement"]
export type UserManagementAbility = Ability<UserManagementTuple>

// Redirects are site-wide: any role may read the table, only Admins may add or
// remove. Same shape as UserManagement today, but kept as its own subject so
// the two can diverge without one silently changing the other.
const _REDIRECT_MANAGEMENT_ACTIONS = ["read", "manage"] as const
export type RedirectManagementActions =
  (typeof _REDIRECT_MANAGEMENT_ACTIONS)[number]
type RedirectManagementTuple = [RedirectManagementActions, "RedirectManagement"]
export type RedirectManagementAbility = Ability<RedirectManagementTuple>

export interface PermissionsProps {
  userId: string
  siteId: number
  resourceId?: string | null
}

export interface BulkPermissionsProps extends Omit<
  PermissionsProps,
  "resourceId"
> {
  action: CrudResourceActions | "publish"
  siteId: Site["id"]
  resourceIds?: (string | null)[]
}

export interface UserPermissionsProps extends PermissionsProps {
  action: CrudResourceActions
}

export interface AssetPermissionsProps extends Pick<
  PermissionsProps,
  "siteId" | "userId"
> {
  resourceId?: string
  action: "create" | "read" | "update" | "delete"
}
