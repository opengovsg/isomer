import type { PureAbility } from "@casl/ability"

import type { Resource as RawResource } from "../database"

type Resource = Pick<RawResource, "parentId">

export const CRUD_ACTIONS = ["create", "read", "update", "delete"] as const
type AllowedResourceActions = (typeof ALL_ACTIONS)[number]
export type CrudResourceActions = (typeof CRUD_ACTIONS)[number]
type Subjects = "Resource" | Resource

export const ALL_ACTIONS = [...CRUD_ACTIONS, "move"] as const
export type ResourcePermissionTuple = [AllowedResourceActions, Subjects]
export type ResourceAbility = PureAbility<ResourcePermissionTuple>
export interface PermissionsProps {
  userId: string
  siteId: number
  resourceId?: string | null
}
