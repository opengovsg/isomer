import { AbilityBuilder, createMongoAbility } from "@casl/ability"
import { resetTables } from "tests/integration/helpers/db"
import {
  setupAdminPermissions,
  setupEditorPermissions,
  setupPageResource,
  setupPublisherPermissions,
  setupSite,
  setupUser,
} from "tests/integration/helpers/seed"

import type { ResourceAbility } from "../permissions.type"
import { db, ResourceType, RoleType } from "../../database"
import { getResourcePermission } from "../permissions.service"
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

describe("getResourcePermission", () => {
  beforeEach(async () => {
    await resetTables("ResourcePermission", "User", "Site", "Resource")
  })

  it("should return site-wide permissions when resourceId is null", async () => {
    // Arrange
    const user = await setupUser({ email: "test@example.com" })
    const site = await setupSite()
    await setupAdminPermissions({ userId: user.id, siteId: site.site.id })

    // Act
    const permissions = await getResourcePermission({
      userId: user.id,
      siteId: site.site.id,
      resourceId: null,
    })

    // Assert
    expect(permissions).toHaveLength(1)
    expect(permissions[0]?.role).toBe(RoleType.Admin)
  })

  it("should return resource-specific permissions when resourceId is provided", async () => {
    // Arrange
    const user = await setupUser({ email: "test@example.com" })
    const { page, site } = await setupPageResource({
      resourceType: ResourceType.Page,
    })

    await db
      .insertInto("ResourcePermission")
      .values({
        userId: user.id,
        siteId: site.id,
        resourceId: page.id,
        role: RoleType.Admin,
        deletedAt: null,
      })
      .execute()

    // Act
    const permissions = await getResourcePermission({
      userId: user.id,
      siteId: site.id,
      resourceId: page.id,
    })

    // Assert
    expect(permissions).toHaveLength(1)
    expect(permissions[0]?.role).toBe(RoleType.Admin)
  })

  it("should return empty array when no permissions exist for user and site", async () => {
    // Arrange
    const user = await setupUser({ email: "test@example.com" })
    const site = await setupSite()

    // Act
    const permissions = await getResourcePermission({
      userId: user.id,
      siteId: site.site.id,
      resourceId: null,
    })

    // Assert
    expect(permissions).toHaveLength(0)
  })

  it("should return empty array when no permissions exist for specific resource", async () => {
    // Arrange
    const user = await setupUser({ email: "test@example.com" })
    const { page, site } = await setupPageResource({
      resourceType: ResourceType.Page,
    })

    // Act
    const permissions = await getResourcePermission({
      userId: user.id,
      siteId: site.id,
      resourceId: page.id,
    })

    // Assert
    expect(permissions).toHaveLength(0)
  })

  it("should not return site-wide permissions when resourceId is provided and is not null", async () => {
    // Arrange
    const user = await setupUser({ email: "test@example.com" })
    const { page, site } = await setupPageResource({
      resourceType: ResourceType.Page,
    })
    await setupAdminPermissions({ userId: user.id, siteId: site.id })

    // Act
    const permissions = await getResourcePermission({
      userId: user.id,
      siteId: site.id,
      resourceId: page.id,
    })

    // Assert
    expect(permissions).toHaveLength(0)
  })

  it("should exclude soft-deleted permissions", async () => {
    // Arrange
    const user = await setupUser({ email: "test@example.com" })
    const site = await setupSite()

    // Create a soft-deleted permission
    await db
      .insertInto("ResourcePermission")
      .values({
        userId: user.id,
        siteId: site.site.id,
        resourceId: null,
        role: RoleType.Admin,
        deletedAt: new Date(),
      })
      .execute()

    // Act
    const permissions = await getResourcePermission({
      userId: user.id,
      siteId: site.site.id,
      resourceId: null,
    })

    // Assert
    expect(permissions).toHaveLength(0)
  })

  it("should only return permissions for the specified user", async () => {
    // Arrange
    const user1 = await setupUser({ email: "user1@example.com" })
    const user2 = await setupUser({ email: "user2@example.com" })
    const site = await setupSite()
    await setupAdminPermissions({ userId: user1.id, siteId: site.site.id })
    await setupEditorPermissions({ userId: user2.id, siteId: site.site.id })

    // Act
    const permissions1 = await getResourcePermission({
      userId: user1.id,
      siteId: site.site.id,
      resourceId: null,
    })

    const permissions2 = await getResourcePermission({
      userId: user2.id,
      siteId: site.site.id,
      resourceId: null,
    })

    // Assert
    expect(permissions1).toHaveLength(1)
    expect(permissions1[0]?.role).toBe(RoleType.Admin)
    expect(permissions2).toHaveLength(1)
    expect(permissions2[0]?.role).toBe(RoleType.Editor)
  })

  it("should only return permissions for the specified site", async () => {
    // Arrange
    const user = await setupUser({ email: "test@example.com" })
    const site1 = await setupSite()
    const site2 = await setupSite()
    await setupAdminPermissions({ userId: user.id, siteId: site1.site.id })
    await setupEditorPermissions({ userId: user.id, siteId: site2.site.id })

    // Act
    const permissions1 = await getResourcePermission({
      userId: user.id,
      siteId: site1.site.id,
      resourceId: null,
    })

    const permissions2 = await getResourcePermission({
      userId: user.id,
      siteId: site2.site.id,
      resourceId: null,
    })

    // Assert
    expect(permissions1).toHaveLength(1)
    expect(permissions1[0]?.role).toBe(RoleType.Admin)
    expect(permissions2).toHaveLength(1)
    expect(permissions2[0]?.role).toBe(RoleType.Editor)
  })
})
