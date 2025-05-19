import type { PureAbility } from "@casl/ability"

import type { Resource as RawResource } from "../database"

type Resource = Pick<RawResource, "parentId">

export const CRUD_ACTIONS = ["create", "read", "update", "delete"] as const
type AllowedResourceActions = (typeof ALL_ACTIONS)[number]
export type CrudResourceActions = (typeof CRUD_ACTIONS)[number]
type Subjects = "Resource" | Resource

export const ALL_ACTIONS = [...CRUD_ACTIONS, "move", "publish"] as const
export type ResourcePermissionTuple = [AllowedResourceActions, Subjects]
export type ResourceAbility = PureAbility<ResourcePermissionTuple>

export type SitePermissionTuple = [CrudResourceActions, "Site"]
export type SiteAbility = PureAbility<SitePermissionTuple>

// Only 2 actions are allowed for UserManagement
// because Admins can update, delete and create users
export const USER_MANAGEMENT_ACTIONS = ["read", "manage"] as const
export type UserManagementActions = (typeof USER_MANAGEMENT_ACTIONS)[number]
export type UserManagementTuple = [UserManagementActions, "UserManagement"]
export type UserManagementAbility = PureAbility<UserManagementTuple>

export interface PermissionsProps {
  userId: string
  siteId: number
  resourceId?: string | null
}
