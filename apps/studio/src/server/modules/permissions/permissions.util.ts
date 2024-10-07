import type { AbilityBuilder } from "@casl/ability"

import type { RoleType } from "../database"
import type { ResourceAbility } from "./permissions.type"
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
    case "Editor":
      return giveBasePermissions(builder)
    case "Admin":
      ALL_ACTIONS.map((action) => {
        builder.can(action, "Resource")
      })
      return
    case "Publisher":
      giveBasePermissions(builder)
      builder.can("publish", "Resource")
      return
  }
}
