import { AbilityBuilder, createMongoAbility } from "@casl/ability"

import { RoleType } from "../../database"
import {
  buildPermissionsFor,
  CRUD_ACTIONS,
  ResourceAbility,
} from "../permissions.service"

const buildPermissions = (role: RoleType) => {
  const builder = new AbilityBuilder<ResourceAbility>(createMongoAbility)
  buildPermissionsFor(role, builder)
  return builder.build({ detectSubjectType: () => "Resource" })
}

describe("permissions.service", () => {
  it("should allow editors to perform CRUD actions on non root pages", () => {
    // Arrange
    const perms = buildPermissions("Editor")
    const expected = true
    const page = { parentId: "2" }

    // Act
    const results = CRUD_ACTIONS.map((action) => {
      return perms.can(action, page)
    })

    // Assert
    expect(results.every((v) => v)).toBe(expected)
  })

  it("should allow editors to update and read root pages", () => {
    // Arrange
    const actions = ["update", "read"] as const
    const rootPage = { parentId: null }
    const perms = buildPermissions("Editor")
    const expected = true

    // Act
    const results = actions.map((action) => {
      return perms.can(action, rootPage)
    })

    // Assert
    expect(results.every((v) => v)).toBe(expected)
  })

  it("should disallow editors from creating and deleting root pages", () => {
    // Arrange
    const actions = ["delete", "create"] as const
    const rootPage = { parentId: null }
    const perms = buildPermissions("Editor")
    const expected = false

    // Act
    const results = actions.map((action) => {
      return perms.can(action, rootPage)
    })

    // Assert
    expect(results.every((v) => v)).toBe(expected)
  })

  it("should allow admins to create and delete root pages", () => {
    // Arrange
    const actions = ["delete", "create"] as const
    const rootPage = { parentId: null }
    const perms = buildPermissions("Admin")
    const expected = true

    // Act
    const results = actions.map((action) => {
      return perms.can(action, rootPage)
    })

    // Assert
    expect(results.every((v) => v)).toBe(expected)
  })
})
