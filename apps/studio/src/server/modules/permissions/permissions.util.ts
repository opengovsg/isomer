import { AbilityBuilder, createMongoAbility } from "@casl/ability"
import { RoleType } from "@prisma/client"

import type { ResourceAbility } from "./permissions.type"
import type { UserManagementAbility } from "~/server/modules/permissions/permissions.type"
import { ALL_ACTIONS, CRUD_ACTIONS } from "./permissions.type"

const giveBasePermissions = (
  builder: AbilityBuilder<ResourceAbility>,
): void => {
  // NOTE: Users can perform every action on non root resources that they have edit access to
  CRUD_ACTIONS.map((action) => {
    builder.can(action, "Resource", { parentId: { $ne: null } })
  })
  builder.can("move", "Resource", { parentId: { $ne: null } })

  // NOTE: For root resources, they can only update and read
  builder.can("update", "Resource", { parentId: { $eq: null } })
  builder.can("read", "Resource", { parentId: { $eq: null } })
}

export const buildPermissionsForResource = (
  role: RoleType,
  builder: AbilityBuilder<ResourceAbility>,
) => {
  switch (role) {
    case RoleType.Editor:
      return giveBasePermissions(builder)
    case RoleType.Admin:
      ALL_ACTIONS.map((action) => {
        builder.can(action, "Resource")
      })
      return
    case RoleType.Publisher:
      giveBasePermissions(builder)
      builder.can("publish", "Resource")
      return
  }
}

export const buildUserManagementPermissions = (roles: { role: RoleType }[]) => {
  const builder = new AbilityBuilder<UserManagementAbility>(createMongoAbility)

  // NOTE: Any role should be able to read the list of user permissions
  if (roles.length === 1) {
    builder.can("read", "UserManagement")
  }

  // Only Admin role can manage permissions
  if (roles.some(({ role }) => role === RoleType.Admin)) {
    builder.can("manage", "UserManagement")
  }

  return builder.build({ detectSubjectType: () => "UserManagement" })
}
