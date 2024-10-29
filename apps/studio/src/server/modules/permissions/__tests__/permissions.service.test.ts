import { AbilityBuilder, createMongoAbility } from "@casl/ability"

import type { ResourceAbility } from "../permissions.type"
import { RoleType } from "../../database"
import { CRUD_ACTIONS } from "../permissions.type"
import { buildPermissionsForResource } from "../permissions.util"

const buildPermissions = (role: RoleType) => {
  const builder = new AbilityBuilder<ResourceAbility>(createMongoAbility)
  buildPermissionsForResource(role, builder)
  return builder.build({ detectSubjectType: () => "Resource" })
}

describe("permissions.service", () => {
  it("should allow editors to perform CRUD actions on non root pages", () => {
    // Arrange
    const perms = buildPermissions(RoleType.Editor)
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
    const perms = buildPermissions(RoleType.Editor)
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
    const perms = buildPermissions(RoleType.Editor)
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
    const perms = buildPermissions(RoleType.Admin)
    const expected = true

    // Act
    const results = actions.map((action) => {
      return perms.can(action, rootPage)
    })

    // Assert
    expect(results.every((v) => v)).toBe(expected)
  })

  it("should allow >1 role and will use the union of all the permissions to determine the user permissison", () => {
    // Arrange
    const actions = ["delete", "create"] as const
    const rootPage = { parentId: null }
    const expected = true
    // NOTE: order is important here because we want to make sure that
    // the later role's permissions don't overwrite the earlier one
    const roles = [RoleType.Admin, RoleType.Editor] as const
    const builder = new AbilityBuilder<ResourceAbility>(createMongoAbility)
    roles.forEach((role) => buildPermissionsForResource(role, builder))
    const perms = builder.build({ detectSubjectType: () => "Resource" })

    // Act
    const results = actions.map((action) => {
      return perms.can(action, rootPage)
    })

    // Assert
    expect(results.every((v) => v)).toBe(expected)
  })

  it("should allow editors to move between folders", () => {
    // Arrange
    const from = { parentId: "2" }
    const to = { parentId: "3" }
    const expected = true
    const perms = buildPermissions(RoleType.Editor)

    // Act
    const canMoveFrom = perms.can("move", from)
    const canMoveTo = perms.can("move", to)

    // Assert
    expect(canMoveFrom).toBe(expected)
    expect(canMoveTo).toBe(expected)
  })

  it("should disallow editors from moving items at the root folder", () => {
    // Arrange
    const from = { parentId: null }
    const to = { parentId: "3" }
    const expected = true
    const perms = buildPermissions(RoleType.Editor)

    // Act
    const canMoveFrom = perms.can("move", from)
    const canMoveTo = perms.can("move", to)

    // Assert
    expect(canMoveFrom).toBe(false)
    expect(canMoveTo).toBe(expected)
  })

  it("should disallow editors from moving items to the root folder", () => {
    // Arrange
    const from = { parentId: "2" }
    const to = { parentId: null }
    const expected = true
    const perms = buildPermissions(RoleType.Editor)

    // Act
    const canMoveFrom = perms.can("move", from)
    const canMoveTo = perms.can("move", to)

    // Assert
    expect(canMoveFrom).toBe(expected)
    expect(canMoveTo).toBe(false)
  })
})
