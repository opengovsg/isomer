import { AbilityBuilder, createMongoAbility, PureAbility } from "@casl/ability"

import { db, Resource as RawResource, RoleType } from "../database"

type Resource = Pick<RawResource, "parentId">
type AllowedResourceActions = (typeof ALL_ACTIONS)[number]
type Subjects = "Resource" | Resource

export const CRUD_ACTIONS = ["create", "read", "update", "delete"] as const
export const ALL_ACTIONS = [...CRUD_ACTIONS, "move"] as const

export type ResourceAbility = PureAbility<[AllowedResourceActions, Subjects]>

interface PermissionsProps {
  userId: string
  siteId: number
  resourceId: string | null
}
export const definePermissionsFor = async ({
  userId,
  siteId,
  resourceId,
}: PermissionsProps) => {
  const builder = new AbilityBuilder<ResourceAbility>(createMongoAbility)
  const roles = await db
    .selectFrom("ResourcePermission")
    .where("userId", "=", userId)
    .where("siteId", "=", siteId)
    .where("resourceId", "=", resourceId)
    .selectAll()
    .execute()

  roles.map(({ role }) => buildPermissionsFor(role, builder))

  return builder.build({ detectSubjectType: () => "Resource" })
}

export const buildPermissionsFor = (
  role: RoleType,
  builder: AbilityBuilder<ResourceAbility>,
) => {
  switch (role) {
    case "Editor":
      // NOTE: Users can perform every action on non root resources that they have edit access to
      CRUD_ACTIONS.map((action) => {
        builder.can(action, "Resource", { parentId: { $ne: null } })
      })
      // NOTE: For root resources, they can only update and read
      builder.can("update", "Resource", { parentId: { $eq: null } })
      builder.can("read", "Resource", { parentId: { $eq: null } })
      return
    case "Admin":
      CRUD_ACTIONS.map((action) => {
        builder.can(action, "Resource")
      })
      return
    case "Publisher":
      throw new Error("Not implemented")
  }
}
