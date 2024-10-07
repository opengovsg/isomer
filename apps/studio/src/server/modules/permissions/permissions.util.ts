import type { AbilityBuilder } from "@casl/ability"

import type { RoleType } from "../database"
import type { ResourceAbility } from "./permissions.type"
import { ALL_ACTIONS } from "./permissions.type"

export const buildPermissionsForResource = (
  role: RoleType,
  builder: AbilityBuilder<ResourceAbility>,
) => {
  switch (role) {
    case "Editor":
      // NOTE: Users can perform every action on non root resources that they have edit access to
      ALL_ACTIONS.map((action) => {
        builder.can(action, "Resource", { parentId: { $ne: null } })
      })
      // NOTE: For root resources, they can only update and read
      builder.can("update", "Resource", { parentId: { $eq: null } })
      builder.can("read", "Resource", { parentId: { $eq: null } })
      return
    case "Admin":
      ALL_ACTIONS.map((action) => {
        builder.can(action, "Resource")
      })
      return
    case "Publisher":
      return
  }
}
