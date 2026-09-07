import { AbilityBuilder, createMongoAbility } from "@casl/ability"
import { TRPCError } from "@trpc/server"
import { resetTables } from "tests/integration/helpers/db"
import {
  setupAdminPermissions,
  setupEditorPermissions,
  setupFolder,
  setupIsomerAdmin,
  setupPageResource,
  setupPublisherPermissions,
  setupSite,
  setupUser,
} from "tests/integration/helpers/seed"
import { describe, expect, it } from "vitest"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

import type { ResourceAbility } from "../permissions.type"
import { db } from "../../database/database"
import { ResourceType, RoleType } from "../../database/types"
import {
  bulkValidateUserPermissionsForResources,
  definePermissionsForResource,
  definePermissionsForSite,
  getResourcePermission,
  isActiveIsomerAdmin,
  validatePermissionsForManagingUsers,
  validateUserIsIsomerAdmin,
  validateUserIsSiteAdmin,
} from "../permissions.service"
import { CRUD_ACTIONS } from "../permissions.type"
import {
  buildPermissionsForResource,
  buildUserManagementPermissions,
} from "../permissions.util"

const buildPermissions = (role: RoleType) => {
  const builder = new AbilityBuilder<ResourceAbility>(createMongoAbility)
  buildPermissionsForResource(role, builder)
  return builder.build({ detectSubjectType: () => "Resource" })
}

describe("permissions.service", () => {
  describe("buildPermissions", () => {
    it("should allow editors to perform CRUD actions on non root pages", () => {
      // Arrange
      const perms = buildPermissions(RoleType.Editor)
      const expected = true
      const page = { parentId: "2" }

      // Act
      const results = CRUD_ACTIONS.map((action) => 
        perms.can(action, page)
      )

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
      const results = actions.map((action) => 
        perms.can(action, rootPage)
      )

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
      const results = actions.map((action) => 
        perms.can(action, rootPage)
      )

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
      const results = actions.map((action) => 
        perms.can(action, rootPage)
      )

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
      roles.forEach((role) =>{  buildPermissionsForResource(role, builder); })
      const perms = builder.build({ detectSubjectType: () => "Resource" })

      // Act
      const results = actions.map((action) => 
        perms.can(action, rootPage)
      )

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

  describe("buildUserManagementPermissions", () => {
    it("should not allow read when user has no roles", () => {
      const perms = buildUserManagementPermissions([])
      expect(perms.can("read", "UserManagement")).toBe(false)
      expect(perms.can("manage", "UserManagement")).toBe(false)
    })

    it("should allow read when user has exactly one role (Editor)", () => {
      const perms = buildUserManagementPermissions([{ role: RoleType.Editor }])
      expect(perms.can("read", "UserManagement")).toBe(true)
      expect(perms.can("manage", "UserManagement")).toBe(false)
    })

    it("should allow read when user has exactly one role (Publisher)", () => {
      const perms = buildUserManagementPermissions([
        { role: RoleType.Publisher },
      ])
      expect(perms.can("read", "UserManagement")).toBe(true)
      expect(perms.can("manage", "UserManagement")).toBe(false)
    })

    it("should allow read when user has multiple non-admin roles (Editor and Publisher)", () => {
      const perms = buildUserManagementPermissions([
        { role: RoleType.Editor },
        { role: RoleType.Publisher },
      ])
      expect(perms.can("read", "UserManagement")).toBe(true)
      expect(perms.can("manage", "UserManagement")).toBe(false)
    })

    it("should allow manage when user has Admin role", () => {
      const perms = buildUserManagementPermissions([{ role: RoleType.Admin }])
      expect(perms.can("read", "UserManagement")).toBe(true)
      expect(perms.can("manage", "UserManagement")).toBe(true)
    })

    it("should allow manage when user has multiple roles including Admin", () => {
      const perms = buildUserManagementPermissions([
        { role: RoleType.Editor },
        { role: RoleType.Admin },
      ])
      expect(perms.can("read", "UserManagement")).toBe(true)
      expect(perms.can("manage", "UserManagement")).toBe(true)
    })
  })

  describe("bulkValidateUserPermissionsForResources", async () => {
    const user = await setupUser({
      email: "user1@example.com",
      isDeleted: false,
      userId: "user1",
    })
    const { site } = await setupSite()
    const { page: rootPage } = await setupPageResource({
      resourceType: "RootPage",
      siteId: site.id,
    })
    const { page: pageWithoutParent } = await setupPageResource({
      resourceType: "Page",
      siteId: site.id,
    })
    const { folder } = await setupFolder({
      siteId: site.id,
    })
    const { page } = await setupPageResource({
      parentId: folder.id,
      resourceType: "Page",
      siteId: site.id,
    })
    const resourceIds = [
      rootPage.id,
      pageWithoutParent.id,
      folder.id,
      page.id,
      null,
    ]

    beforeEach(async () => {
      await resetTables("ResourcePermission")
    })

    describe("create", () => {
      describe("admin", () => {
        it("should allow admins to create root resources", async () => {
          // Arrange
          await setupAdminPermissions({ siteId: site.id, userId: user.id })

          // Act
          const validation = bulkValidateUserPermissionsForResources({
            action: "create",
            resourceIds: [null, folder.id],
            siteId: site.id,
            userId: user.id,
          })

          // Assert
          await expect(validation).resolves.not.toThrow()
        })
      })

      describe("publisher", () => {
        it("should allow publishers to create non-root resources", async () => {
          // Arrange
          await setupPublisherPermissions({ siteId: site.id, userId: user.id })

          // Act
          const validation = bulkValidateUserPermissionsForResources({
            action: "create",
            resourceIds: [folder.id],
            siteId: site.id,
            userId: user.id,
          })

          // Assert
          await expect(validation).resolves.not.toThrow()
        })

        it("should not allow publishers to create root resources", async () => {
          // Arrange
          await setupPublisherPermissions({ siteId: site.id, userId: user.id })

          // Act
          const validation = bulkValidateUserPermissionsForResources({
            action: "create",
            resourceIds: [null],
            siteId: site.id,
            userId: user.id,
          })

          // Assert
          await expect(validation).rejects.toThrow(
            "You do not have sufficient permissions to perform this action",
          )
        })

        it("sould not allow publishers to create root resources among non-root resources", async () => {
          // Arrange
          await setupPublisherPermissions({ siteId: site.id, userId: user.id })

          // Act
          const validation = bulkValidateUserPermissionsForResources({
            action: "create",
            resourceIds: [folder.id, null],
            siteId: site.id,
            userId: user.id,
          })

          // Assert
          await expect(validation).rejects.toThrow(
            "You do not have sufficient permissions to perform this action",
          )
        })
      })

      describe("editor", () => {
        it("should allow editors to create non-root resources", async () => {
          // Arrange
          await setupEditorPermissions({ siteId: site.id, userId: user.id })

          // Act
          const validation = bulkValidateUserPermissionsForResources({
            action: "create",
            resourceIds: [folder.id],
            siteId: site.id,
            userId: user.id,
          })

          // Assert
          await expect(validation).resolves.not.toThrow()
        })

        it("should not allow editors to create root resources", async () => {
          // Arrange
          await setupEditorPermissions({ siteId: site.id, userId: user.id })

          // Act
          const validation = bulkValidateUserPermissionsForResources({
            action: "create",
            resourceIds: [null],
            siteId: site.id,
            userId: user.id,
          })

          // Assert
          await expect(validation).rejects.toThrow(
            "You do not have sufficient permissions to perform this action",
          )
        })

        it("should not allow editors to create non-root resources among root resources", async () => {
          // Arrange
          await setupEditorPermissions({ siteId: site.id, userId: user.id })

          // Act
          const validation = bulkValidateUserPermissionsForResources({
            action: "create",
            resourceIds: [folder.id, null],
            siteId: site.id,
            userId: user.id,
          })

          // Assert
          await expect(validation).rejects.toThrow(
            "You do not have sufficient permissions to perform this action",
          )
        })
      })

      describe("no permissions", () => {
        it("should not allow users without permissions to create resources", async () => {
          // Act
          const validation = bulkValidateUserPermissionsForResources({
            action: "create",
            resourceIds: [folder.id],
            siteId: site.id,
            userId: user.id,
          })

          // Assert
          await expect(validation).rejects.toThrow(
            "You do not have sufficient permissions to perform this action",
          )
        })
      })
    })

    describe("read", () => {
      describe("admin", () => {
        it("should allow admins to read any resource", async () => {
          // Arrange
          await setupAdminPermissions({ siteId: site.id, userId: user.id })

          for (const resourceId of resourceIds) {
            // Act (single resource)
            const validation = bulkValidateUserPermissionsForResources({
              action: "read",
              resourceIds: [resourceId],
              siteId: site.id,
              userId: user.id,
            })

            // Assert (single resource)
            await expect(validation).resolves.not.toThrow()
          }

          // Act (multiple resources)
          const bulkValidation = bulkValidateUserPermissionsForResources({
            action: "read",
            resourceIds,
            siteId: site.id,
            userId: user.id,
          })

          // Assert (multiple resources)
          await expect(bulkValidation).resolves.not.toThrow()
        })
      })

      describe("publisher", () => {
        // Note: currently we do not have resource-level permissions
        it("should allow publishers to read any resource", async () => {
          await setupPublisherPermissions({ siteId: site.id, userId: user.id })

          for (const resourceId of resourceIds) {
            // Act (single resource)
            const validation = bulkValidateUserPermissionsForResources({
              action: "read",
              resourceIds: [resourceId],
              siteId: site.id,
              userId: user.id,
            })

            // Assert (single resource)
            await expect(validation).resolves.not.toThrow()
          }

          // Act (multiple resources)
          const bulkValidation = bulkValidateUserPermissionsForResources({
            action: "read",
            resourceIds,
            siteId: site.id,
            userId: user.id,
          })

          // Assert (multiple resources)
          await expect(bulkValidation).resolves.not.toThrow()
        })
      })

      describe("editor", () => {
        // Note: currently we do not have resource-level permissions
        it("should allow editors to read any resource", async () => {
          await setupEditorPermissions({ siteId: site.id, userId: user.id })

          for (const resourceId of resourceIds) {
            // Act (single resource)
            const validation = bulkValidateUserPermissionsForResources({
              action: "read",
              resourceIds: [resourceId],
              siteId: site.id,
              userId: user.id,
            })

            // Assert (single resource)
            await expect(validation).resolves.not.toThrow()
          }

          // Act (multiple resources)
          const bulkValidation = bulkValidateUserPermissionsForResources({
            action: "read",
            resourceIds,
            siteId: site.id,
            userId: user.id,
          })

          // Assert (multiple resources)
          await expect(bulkValidation).resolves.not.toThrow()
        })
      })

      describe("no permissions", () => {
        it("should not allow users without permissions to read any resources", async () => {
          for (const resourceId of resourceIds) {
            // Act (single resource)
            const validation = bulkValidateUserPermissionsForResources({
              action: "read",
              resourceIds: [resourceId],
              siteId: site.id,
              userId: user.id,
            })

            // Assert (single resource)
            await expect(validation).rejects.toThrow(
              "You do not have sufficient permissions to perform this action",
            )
          }

          // Act (multiple resources)
          const bulkValidation = bulkValidateUserPermissionsForResources({
            action: "read",
            resourceIds,
            siteId: site.id,
            userId: user.id,
          })

          // Assert (multiple resources)
          await expect(bulkValidation).rejects.toThrow(
            "You do not have sufficient permissions to perform this action",
          )
        })
      })

      describe("should throw error if resource is not found", () => {
        it("single resource", async () => {
          // Arrange
          await setupAdminPermissions({ siteId: site.id, userId: user.id })

          // Act
          const validation = bulkValidateUserPermissionsForResources({
            action: "read",
            resourceIds: ["999999999"],
            siteId: site.id,
            userId: user.id,
          })

          // Assert
          await expect(validation).rejects.toThrow(
            new TRPCError({
              code: "NOT_FOUND",
              message: "Resource not found",
            }),
          )
        })

        it("multiple resources", async () => {
          // Arrange
          await setupAdminPermissions({ siteId: site.id, userId: user.id })

          // Act
          const validation = bulkValidateUserPermissionsForResources({
            action: "read",
            resourceIds: ["999999999", "999999998"],
            siteId: site.id,
            userId: user.id,
          })

          // Assert
          await expect(validation).rejects.toThrow(
            new TRPCError({
              code: "NOT_FOUND",
              message: "Resources not found",
            }),
          )
        })
      })
    })

    describe("update", () => {
      describe("admin", () => {
        it("should allow admins to update any resources", async () => {
          // Arrange
          await setupAdminPermissions({ siteId: site.id, userId: user.id })

          for (const resourceId of resourceIds) {
            // Act (single resource)
            const validation = bulkValidateUserPermissionsForResources({
              action: "update",
              resourceIds: [resourceId],
              siteId: site.id,
              userId: user.id,
            })

            // Assert (single resource)
            await expect(validation).resolves.not.toThrow()
          }

          // Act (multiple resources)
          const bulkValidation = bulkValidateUserPermissionsForResources({
            action: "update",
            resourceIds,
            siteId: site.id,
            userId: user.id,
          })

          // Assert (multiple resources)
          await expect(bulkValidation).resolves.not.toThrow()
        })
      })

      describe("publisher", () => {
        it("should allow publishers to update any resources", async () => {
          // Arrange
          await setupPublisherPermissions({ siteId: site.id, userId: user.id })

          for (const resourceId of resourceIds) {
            // Act (single resource)
            const validation = bulkValidateUserPermissionsForResources({
              action: "update",
              resourceIds: [resourceId],
              siteId: site.id,
              userId: user.id,
            })

            // Assert (single resource)
            await expect(validation).resolves.not.toThrow()
          }

          // Act (multiple resources)
          const bulkValidation = bulkValidateUserPermissionsForResources({
            action: "update",
            resourceIds,
            siteId: site.id,
            userId: user.id,
          })

          // Assert (multiple resources)
          await expect(bulkValidation).resolves.not.toThrow()
        })
      })

      describe("editor", () => {
        it("should allow editors to update any resources", async () => {
          // Arrange
          await setupEditorPermissions({ siteId: site.id, userId: user.id })

          for (const resourceId of resourceIds) {
            // Act (single resource)
            const validation = bulkValidateUserPermissionsForResources({
              action: "update",
              resourceIds: [resourceId],
              siteId: site.id,
              userId: user.id,
            })

            // Assert (single resource)
            await expect(validation).resolves.not.toThrow()
          }

          // Act (multiple resources)
          const bulkValidation = bulkValidateUserPermissionsForResources({
            action: "update",
            resourceIds,
            siteId: site.id,
            userId: user.id,
          })

          // Assert (multiple resources)
          await expect(bulkValidation).resolves.not.toThrow()
        })
      })

      describe("no permissions", () => {
        it("should not allow users without permissions to update any resources", async () => {
          for (const resourceId of resourceIds) {
            // Act (single resource)
            const validation = bulkValidateUserPermissionsForResources({
              action: "update",
              resourceIds: [resourceId],
              siteId: site.id,
              userId: user.id,
            })

            // Assert
            await expect(validation).rejects.toThrow(
              "You do not have sufficient permissions to perform this action",
            )
          }

          // Act (multiple resources)
          const bulkValidation = bulkValidateUserPermissionsForResources({
            action: "update",
            resourceIds,
            siteId: site.id,
            userId: user.id,
          })

          // Assert (multiple resources)
          await expect(bulkValidation).rejects.toThrow(
            "You do not have sufficient permissions to perform this action",
          )
        })
      })

      it("should throw error if resource is not found", async () => {
        // Arrange
        await setupAdminPermissions({ siteId: site.id, userId: user.id })

        // Act
        const validation = bulkValidateUserPermissionsForResources({
          action: "update",
          resourceIds: ["999999999"],
          siteId: site.id,
          userId: user.id,
        })

        // Assert
        await expect(validation).rejects.toThrow("Resource not found")
      })
    })

    describe("delete", () => {
      describe("admin", () => {
        it("should allow admins to delete any resources", async () => {
          // Arrange
          await setupAdminPermissions({ siteId: site.id, userId: user.id })

          for (const resourceId of resourceIds) {
            // Act (single resource)
            const validation = bulkValidateUserPermissionsForResources({
              action: "delete",
              resourceIds: [resourceId],
              siteId: site.id,
              userId: user.id,
            })

            // Assert (single resource)
            await expect(validation).resolves.not.toThrow()
          }

          // Act (multiple resources)
          const bulkValidation = bulkValidateUserPermissionsForResources({
            action: "delete",
            resourceIds,
            siteId: site.id,
            userId: user.id,
          })

          // Assert (multiple resources)
          await expect(bulkValidation).resolves.not.toThrow()
        })
      })

      describe("publisher", () => {
        it("should allow publishers to delete non-root resources", async () => {
          // Arrange
          await setupPublisherPermissions({ siteId: site.id, userId: user.id })
          const nonRootResourceIds = [page.id]

          for (const resourceId of nonRootResourceIds) {
            // Act (single resource)
            const validation = bulkValidateUserPermissionsForResources({
              action: "delete",
              resourceIds: [resourceId],
              siteId: site.id,
              userId: user.id,
            })

            // Assert (single resource)
            await expect(validation).resolves.not.toThrow()
          }

          // Act (multiple resources)
          const bulkValidation = bulkValidateUserPermissionsForResources({
            action: "delete",
            resourceIds: nonRootResourceIds,
            siteId: site.id,
            userId: user.id,
          })

          // Assert (multiple resources)
          await expect(bulkValidation).resolves.not.toThrow()
        })

        it("should not allow publishers to delete root resources", async () => {
          // Arrange
          await setupPublisherPermissions({ siteId: site.id, userId: user.id })
          const rootResourceIds = [
            rootPage.id,
            pageWithoutParent.id,
            folder.id,
            null,
          ]

          for (const resourceId of rootResourceIds) {
            // Act (single resource)
            const validation = bulkValidateUserPermissionsForResources({
              action: "delete",
              resourceIds: [resourceId],
              siteId: site.id,
              userId: user.id,
            })

            // Assert (single resource)
            await expect(validation).rejects.toThrow(
              "You do not have sufficient permissions to perform this action",
            )
          }

          // Act (multiple resources)
          const bulkValidation = bulkValidateUserPermissionsForResources({
            action: "delete",
            resourceIds: rootResourceIds,
            siteId: site.id,
            userId: user.id,
          })

          // Assert (multiple resources)
          await expect(bulkValidation).rejects.toThrow(
            "You do not have sufficient permissions to perform this action",
          )
        })
      })

      describe("editor", () => {
        it("should allow editors to delete non-root resources", async () => {
          // Arrange
          await setupEditorPermissions({ siteId: site.id, userId: user.id })
          const nonRootResourceIds = [page.id]

          for (const resourceId of nonRootResourceIds) {
            // Act (single resource)
            const validation = bulkValidateUserPermissionsForResources({
              action: "delete",
              resourceIds: [resourceId],
              siteId: site.id,
              userId: user.id,
            })

            // Assert (single resource)
            await expect(validation).resolves.not.toThrow()
          }

          // Act (multiple resources)
          const bulkValidation = bulkValidateUserPermissionsForResources({
            action: "delete",
            resourceIds: nonRootResourceIds,
            siteId: site.id,
            userId: user.id,
          })

          // Assert (multiple resources)
          await expect(bulkValidation).resolves.not.toThrow()
        })

        it("should not allow editors to delete root resources", async () => {
          // Arrange
          await setupEditorPermissions({ siteId: site.id, userId: user.id })
          const rootResourceIds = [
            rootPage.id,
            pageWithoutParent.id,
            folder.id,
            null,
          ]

          for (const resourceId of rootResourceIds) {
            // Act (single resource)
            const validation = bulkValidateUserPermissionsForResources({
              action: "delete",
              resourceIds: [resourceId],
              siteId: site.id,
              userId: user.id,
            })

            // Assert (single resource)
            await expect(validation).rejects.toThrow(
              "You do not have sufficient permissions to perform this action",
            )
          }

          // Act (multiple resources)
          const bulkValidation = bulkValidateUserPermissionsForResources({
            action: "delete",
            resourceIds: rootResourceIds,
            siteId: site.id,
            userId: user.id,
          })

          // Assert (multiple resources)
          await expect(bulkValidation).rejects.toThrow(
            "You do not have sufficient permissions to perform this action",
          )
        })
      })

      describe("no permissions", () => {
        it("should not allow users without permissions to delete any resources", async () => {
          for (const resourceId of resourceIds) {
            // Act (single resource)
            const validation = bulkValidateUserPermissionsForResources({
              action: "delete",
              resourceIds: [resourceId],
              siteId: site.id,
              userId: user.id,
            })

            // Assert (single resource)
            await expect(validation).rejects.toThrow(
              "You do not have sufficient permissions to perform this action",
            )
          }

          // Act (multiple resources)
          const bulkValidation = bulkValidateUserPermissionsForResources({
            action: "delete",
            resourceIds,
            siteId: site.id,
            userId: user.id,
          })

          // Assert (multiple resources)
          await expect(bulkValidation).rejects.toThrow(
            "You do not have sufficient permissions to perform this action",
          )
        })
      })

      it("should throw error if resource is not found", async () => {
        // Arrange
        await setupAdminPermissions({ siteId: site.id, userId: user.id })

        // Act
        const validation = bulkValidateUserPermissionsForResources({
          action: "delete",
          resourceIds: ["999999999"],
          siteId: site.id,
          userId: user.id,
        })

        // Assert
        await expect(validation).rejects.toThrow("Resource not found")
      })
    })

    describe("publish", () => {
      describe("admin", () => {
        it("should allow admins to publish any resources", async () => {
          // Arrange
          await setupAdminPermissions({ siteId: site.id, userId: user.id })

          for (const resourceId of resourceIds) {
            // Act (single resource)
            const validation = bulkValidateUserPermissionsForResources({
              action: "publish",
              resourceIds: [resourceId],
              siteId: site.id,
              userId: user.id,
            })

            // Assert (single resource)
            await expect(validation).resolves.not.toThrow()
          }

          // Act (multiple resources)
          const bulkValidation = bulkValidateUserPermissionsForResources({
            action: "publish",
            resourceIds,
            siteId: site.id,
            userId: user.id,
          })

          // Assert (multiple resources)
          await expect(bulkValidation).resolves.not.toThrow()
        })
      })

      describe("publisher", () => {
        it("should allow publishers to publish any resources", async () => {
          // Arrange
          await setupPublisherPermissions({ siteId: site.id, userId: user.id })

          for (const resourceId of resourceIds) {
            // Act (single resource)
            const validation = bulkValidateUserPermissionsForResources({
              action: "publish",
              resourceIds: [resourceId],
              siteId: site.id,
              userId: user.id,
            })

            // Assert (single resource)
            await expect(validation).resolves.not.toThrow()
          }

          // Act (multiple resources)
          const bulkValidation = bulkValidateUserPermissionsForResources({
            action: "publish",
            resourceIds,
            siteId: site.id,
            userId: user.id,
          })

          // Assert (multiple resources)
          await expect(bulkValidation).resolves.not.toThrow()
        })
      })

      describe("editor", () => {
        it("should not allow editors to publish resources", async () => {
          // Arrange
          await setupEditorPermissions({ siteId: site.id, userId: user.id })

          for (const resourceId of resourceIds) {
            // Act (single resource)
            const validation = bulkValidateUserPermissionsForResources({
              action: "publish",
              resourceIds: [resourceId],
              siteId: site.id,
              userId: user.id,
            })

            // Assert (single resource)
            await expect(validation).rejects.toThrow(
              "You do not have sufficient permissions to perform this action",
            )
          }

          // Act (multiple resources)
          const bulkValidation = bulkValidateUserPermissionsForResources({
            action: "publish",
            resourceIds,
            siteId: site.id,
            userId: user.id,
          })

          // Assert (multiple resources)
          await expect(bulkValidation).rejects.toThrow(
            "You do not have sufficient permissions to perform this action",
          )
        })
      })

      describe("no permissions", () => {
        it("should not allow users without permissions to publish any resources", async () => {
          for (const resourceId of resourceIds) {
            // Act (single resource)
            const validation = bulkValidateUserPermissionsForResources({
              action: "publish",
              resourceIds: [resourceId],
              siteId: site.id,
              userId: user.id,
            })

            // Assert (single resource)
            await expect(validation).rejects.toThrow(
              "You do not have sufficient permissions to perform this action",
            )
          }

          // Act (multiple resources)
          const bulkValidation = bulkValidateUserPermissionsForResources({
            action: "publish",
            resourceIds,
            siteId: site.id,
            userId: user.id,
          })

          // Assert (multiple resources)
          await expect(bulkValidation).rejects.toThrow(
            "You do not have sufficient permissions to perform this action",
          )
        })
      })

      it("should throw error if resource is not found", async () => {
        // Arrange
        await setupAdminPermissions({ siteId: site.id, userId: user.id })

        // Act
        const validation = bulkValidateUserPermissionsForResources({
          action: "publish",
          resourceIds: ["999999999"],
          siteId: site.id,
          userId: user.id,
        })

        // Assert
        await expect(validation).rejects.toThrow("Resource not found")
      })
    })

    describe("Isomer Admin", () => {
      beforeEach(async () => {
        await resetTables("IsomerAdmin")
      })

      it("should allow an Isomer Admin to perform all actions including root-level create/delete", async () => {
        // Arrange
        await setupIsomerAdmin({ userId: user.id })

        for (const action of [...CRUD_ACTIONS, "publish"] as const) {
          // Act
          const validation = bulkValidateUserPermissionsForResources({
            action,
            resourceIds,
            siteId: site.id,
            userId: user.id,
          })

          // Assert
          await expect(validation).resolves.not.toThrow()
        }
      })

      it("should not allow an expired Isomer Admin to perform root-level actions", async () => {
        // Arrange
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
        await setupIsomerAdmin({ expiry: yesterday, userId: user.id })

        // Act
        const validation = bulkValidateUserPermissionsForResources({
          action: "create",
          resourceIds: [null],
          siteId: site.id,
          userId: user.id,
        })

        // Assert
        await expect(validation).rejects.toThrow(
          "You do not have sufficient permissions to perform this action",
        )
      })
    })
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
    await setupAdminPermissions({ siteId: site.site.id, userId: user.id })

    // Act
    const permissions = await getResourcePermission({
      resourceId: null,
      siteId: site.site.id,
      userId: user.id,
    })

    // Assert
    expect(permissions).toHaveLength(1)
    expect(permissions[0]?.role).toBe(RoleType.Admin)
  })

  // TODO: add this back in when we have resource-specific permissions
  it.skip("should return resource-specific permissions when resourceId is provided", async () => {
    // Arrange
    const user = await setupUser({ email: "test@example.com" })
    const { page, site } = await setupPageResource({
      resourceType: ResourceType.Page,
    })

    await db
      .insertInto("ResourcePermission")
      .values({
        deletedAt: null,
        resourceId: page.id,
        role: RoleType.Admin,
        siteId: site.id,
        userId: user.id,
      })
      .execute()

    // Act
    const permissions = await getResourcePermission({
      resourceId: page.id,
      siteId: site.id,
      userId: user.id,
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
      resourceId: null,
      siteId: site.site.id,
      userId: user.id,
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
      resourceId: page.id,
      siteId: site.id,
      userId: user.id,
    })

    // Assert
    expect(permissions).toHaveLength(0)
  })

  // TODO: add this back in when we have resource-specific permissions
  it.skip("should not return site-wide permissions when resourceId is provided and is not null", async () => {
    // Arrange
    const user = await setupUser({ email: "test@example.com" })
    const { page, site } = await setupPageResource({
      resourceType: ResourceType.Page,
    })
    await setupAdminPermissions({ siteId: site.id, userId: user.id })

    // Act
    const permissions = await getResourcePermission({
      resourceId: page.id,
      siteId: site.id,
      userId: user.id,
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
        deletedAt: new Date(),
        resourceId: null,
        role: RoleType.Admin,
        siteId: site.site.id,
        userId: user.id,
      })
      .execute()

    // Act
    const permissions = await getResourcePermission({
      resourceId: null,
      siteId: site.site.id,
      userId: user.id,
    })

    // Assert
    expect(permissions).toHaveLength(0)
  })

  it("should only return permissions for the specified user", async () => {
    // Arrange
    const user1 = await setupUser({ email: "user1@example.com" })
    const user2 = await setupUser({ email: "user2@example.com" })
    const site = await setupSite()
    await setupAdminPermissions({ siteId: site.site.id, userId: user1.id })
    await setupEditorPermissions({ siteId: site.site.id, userId: user2.id })

    // Act
    const permissions1 = await getResourcePermission({
      resourceId: null,
      siteId: site.site.id,
      userId: user1.id,
    })

    const permissions2 = await getResourcePermission({
      resourceId: null,
      siteId: site.site.id,
      userId: user2.id,
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
    await setupAdminPermissions({ siteId: site1.site.id, userId: user.id })
    await setupEditorPermissions({ siteId: site2.site.id, userId: user.id })

    // Act
    const permissions1 = await getResourcePermission({
      resourceId: null,
      siteId: site1.site.id,
      userId: user.id,
    })

    const permissions2 = await getResourcePermission({
      resourceId: null,
      siteId: site2.site.id,
      userId: user.id,
    })

    // Assert
    expect(permissions1).toHaveLength(1)
    expect(permissions1[0]?.role).toBe(RoleType.Admin)
    expect(permissions2).toHaveLength(1)
    expect(permissions2[0]?.role).toBe(RoleType.Editor)
  })

  describe("Isomer Admin", () => {
    it("should return Admin role for an Isomer Admin without any explicit ResourcePermission", async () => {
      // Arrange
      const user = await setupUser({ email: "test@example.com" })
      const site = await setupSite()
      await setupIsomerAdmin({ userId: user.id })

      // Act
      const permissions = await getResourcePermission({
        resourceId: null,
        siteId: site.site.id,
        userId: user.id,
      })

      // Assert
      expect(permissions).toHaveLength(1)
      expect(permissions[0]?.role).toBe(RoleType.Admin)
    })

    it("should return Admin role for an Isomer Admin even if they have an explicit non-admin role", async () => {
      // Arrange
      const user = await setupUser({ email: "test@example.com" })
      const site = await setupSite()
      await setupIsomerAdmin({ userId: user.id })
      await setupEditorPermissions({ siteId: site.site.id, userId: user.id })

      // Act
      const permissions = await getResourcePermission({
        resourceId: null,
        siteId: site.site.id,
        userId: user.id,
      })

      // Assert — Isomer Admin overrides explicit Editor role
      expect(permissions).toHaveLength(1)
      expect(permissions[0]?.role).toBe(RoleType.Admin)
    })

    it("should return the explicit role when Isomer Admin entry is expired", async () => {
      // Arrange
      const user = await setupUser({ email: "test@example.com" })
      const site = await setupSite()
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      await setupIsomerAdmin({ expiry: yesterday, userId: user.id })
      await setupEditorPermissions({ siteId: site.site.id, userId: user.id })

      // Act
      const permissions = await getResourcePermission({
        resourceId: null,
        siteId: site.site.id,
        userId: user.id,
      })

      // Assert — expired Isomer Admin falls back to explicit role
      expect(permissions).toHaveLength(1)
      expect(permissions[0]?.role).toBe(RoleType.Editor)
    })

    it("should return the explicit role when Isomer Admin entry has expired", async () => {
      // Arrange
      const user = await setupUser({ email: "test@example.com" })
      const site = await setupSite()
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      await setupEditorPermissions({ siteId: site.site.id, userId: user.id })
      await setupIsomerAdmin({ expiry: yesterday, userId: user.id })

      // Act
      const permissions = await getResourcePermission({
        resourceId: null,
        siteId: site.site.id,
        userId: user.id,
      })

      // Assert — expired Isomer Admin falls back to explicit role
      expect(permissions).toHaveLength(1)
      expect(permissions[0]?.role).toBe(RoleType.Editor)
    })
  })
})

describe("isActiveIsomerAdmin", () => {
  beforeEach(async () => {
    await resetTables("IsomerAdmin", "User")
  })

  it("should return true for an active Isomer Admin with no expiry", async () => {
    const user = await setupUser({ email: "test@example.com" })
    await setupIsomerAdmin({ role: IsomerAdminRole.Core, userId: user.id })

    expect(await isActiveIsomerAdmin(user.id)).toBe(true)
  })

  it("should return true for an active Isomer Admin with a future expiry", async () => {
    const user = await setupUser({ email: "test@example.com" })
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await setupIsomerAdmin({ expiry: tomorrow, userId: user.id })

    expect(await isActiveIsomerAdmin(user.id)).toBe(true)
  })

  it("should return false for an expired Isomer Admin", async () => {
    const user = await setupUser({ email: "test@example.com" })
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    await setupIsomerAdmin({ expiry: yesterday, userId: user.id })

    expect(await isActiveIsomerAdmin(user.id)).toBe(false)
  })

  it("should return false for an Isomer Admin whose expiry is exactly now", async () => {
    const user = await setupUser({ email: "test@example.com" })
    // Set expiry to a moment in the past to simulate just-expired
    const justExpired = new Date(Date.now() - 1000)
    await setupIsomerAdmin({ expiry: justExpired, userId: user.id })

    expect(await isActiveIsomerAdmin(user.id)).toBe(false)
  })

  it("should return false for a user with no IsomerAdmin row", async () => {
    const user = await setupUser({ email: "test@example.com" })

    expect(await isActiveIsomerAdmin(user.id)).toBe(false)
  })

  describe("role filtering", () => {
    it("should return true when the user's role matches the requested roles", async () => {
      const user = await setupUser({ email: "test@example.com" })
      await setupIsomerAdmin({ role: IsomerAdminRole.Core, userId: user.id })

      expect(await isActiveIsomerAdmin(user.id, [IsomerAdminRole.Core])).toBe(
        true,
      )
    })

    it("should return false when the user's role does not match the requested roles", async () => {
      const user = await setupUser({ email: "test@example.com" })
      await setupIsomerAdmin({
        role: IsomerAdminRole.Migrator,
        userId: user.id,
      })

      expect(await isActiveIsomerAdmin(user.id, [IsomerAdminRole.Core])).toBe(
        false,
      )
    })

    it("should return true when the user's role is among multiple requested roles", async () => {
      const user = await setupUser({ email: "test@example.com" })
      await setupIsomerAdmin({
        role: IsomerAdminRole.Migrator,
        userId: user.id,
      })

      expect(
        await isActiveIsomerAdmin(user.id, [
          IsomerAdminRole.Core,
          IsomerAdminRole.Migrator,
        ]),
      ).toBe(true)
    })
  })
})

describe("validateUserIsIsomerAdmin", () => {
  beforeEach(async () => {
    await resetTables("IsomerAdmin", "User")
  })

  it("should not throw for an active Isomer Admin with a matching role", async () => {
    const user = await setupUser({ email: "test@example.com" })
    await setupIsomerAdmin({ role: IsomerAdminRole.Core, userId: user.id })

    await expect(
      validateUserIsIsomerAdmin({
        roles: [IsomerAdminRole.Core],
        userId: user.id,
      }),
    ).resolves.not.toThrow()
  })

  it("should throw FORBIDDEN for a user with no IsomerAdmin row", async () => {
    const user = await setupUser({ email: "test@example.com" })

    await expect(
      validateUserIsIsomerAdmin({
        roles: [IsomerAdminRole.Core],
        userId: user.id,
      }),
    ).rejects.toThrow(
      new TRPCError({
        code: "FORBIDDEN",
        message:
          "You do not have sufficient permissions to perform this action",
      }),
    )
  })

  it("should throw FORBIDDEN for an expired Isomer Admin", async () => {
    const user = await setupUser({ email: "test@example.com" })
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    await setupIsomerAdmin({ expiry: yesterday, userId: user.id })

    await expect(
      validateUserIsIsomerAdmin({
        roles: [IsomerAdminRole.Core],
        userId: user.id,
      }),
    ).rejects.toThrow(
      new TRPCError({
        code: "FORBIDDEN",
        message:
          "You do not have sufficient permissions to perform this action",
      }),
    )
  })

  it("should throw FORBIDDEN when role does not match", async () => {
    const user = await setupUser({ email: "test@example.com" })
    await setupIsomerAdmin({ role: IsomerAdminRole.Migrator, userId: user.id })

    await expect(
      validateUserIsIsomerAdmin({
        roles: [IsomerAdminRole.Core],
        userId: user.id,
      }),
    ).rejects.toThrow(
      new TRPCError({
        code: "FORBIDDEN",
        message:
          "You do not have sufficient permissions to perform this action",
      }),
    )
  })
})

describe("validateUserIsSiteAdmin", () => {
  beforeEach(async () => {
    await resetTables("IsomerAdmin", "ResourcePermission", "User", "Site")
  })

  it("should allow a Site Admin", async () => {
    // Arrange
    const user = await setupUser({ email: "site-admin@example.com" })
    const { site } = await setupSite()
    await setupAdminPermissions({ siteId: site.id, userId: user.id })

    // Act & Assert
    await expect(
      validateUserIsSiteAdmin({ siteId: site.id, userId: user.id }),
    ).resolves.toBe(true)
  })

  it("should allow an active Isomer Admin without a site permission", async () => {
    // Arrange
    const user = await setupUser({ email: "isomer-admin@example.com" })
    const { site } = await setupSite()
    await setupIsomerAdmin({ userId: user.id })

    // Act & Assert
    await expect(
      validateUserIsSiteAdmin({ siteId: site.id, userId: user.id }),
    ).resolves.toBe(true)
  })

  it("should reject an expired Isomer Admin without a site permission", async () => {
    // Arrange
    const user = await setupUser({ email: "expired-admin@example.com" })
    const { site } = await setupSite()
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    await setupIsomerAdmin({ expiry: yesterday, userId: user.id })

    // Act & Assert
    await expect(
      validateUserIsSiteAdmin({ siteId: site.id, userId: user.id }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" })
  })
})

describe("definePermissionsForResource", () => {
  beforeEach(async () => {
    await resetTables(
      "IsomerAdmin",
      "ResourcePermission",
      "User",
      "Site",
      "Resource",
    )
  })

  it("should grant full resource permissions to an Isomer Admin without any ResourcePermission", async () => {
    // Arrange
    const user = await setupUser({ email: "test@example.com" })
    const { site } = await setupSite()
    await setupIsomerAdmin({ userId: user.id })

    // Act
    const perms = await definePermissionsForResource({
      siteId: site.id,
      userId: user.id,
    })

    // Assert — Isomer Admin can create/delete at root
    expect(perms.can("create", { parentId: null })).toBe(true)
    expect(perms.can("delete", { parentId: null })).toBe(true)
    expect(perms.can("read", { parentId: null })).toBe(true)
    expect(perms.can("update", { parentId: null })).toBe(true)
  })

  it("should not grant admin resource permissions to an expired Isomer Admin without ResourcePermission", async () => {
    // Arrange
    const user = await setupUser({ email: "test@example.com" })
    const { site } = await setupSite()
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    await setupIsomerAdmin({ expiry: yesterday, userId: user.id })

    // Act
    const perms = await definePermissionsForResource({
      siteId: site.id,
      userId: user.id,
    })

    // Assert — expired Isomer Admin has no permissions
    expect(perms.can("create", { parentId: null })).toBe(false)
    expect(perms.can("delete", { parentId: null })).toBe(false)
  })
})

describe("definePermissionsForSite", () => {
  beforeEach(async () => {
    await resetTables("IsomerAdmin", "ResourcePermission", "User", "Site")
  })

  it("should grant full site permissions to an Isomer Admin without any ResourcePermission", async () => {
    // Arrange
    const user = await setupUser({ email: "test@example.com" })
    const { site } = await setupSite()
    await setupIsomerAdmin({ userId: user.id })

    // Act
    const perms = await definePermissionsForSite({
      siteId: site.id,
      userId: user.id,
    })

    // Assert
    expect(perms.can("read", "Site")).toBe(true)
    CRUD_ACTIONS.forEach((action) => {
      expect(perms.can(action, "Site")).toBe(true)
    })
  })

  it("should not grant site permissions to an expired Isomer Admin without ResourcePermission", async () => {
    // Arrange
    const user = await setupUser({ email: "test@example.com" })
    const { site } = await setupSite()
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    await setupIsomerAdmin({ expiry: yesterday, userId: user.id })

    // Act
    const perms = await definePermissionsForSite({
      siteId: site.id,
      userId: user.id,
    })

    // Assert
    expect(perms.can("read", "Site")).toBe(false)
    CRUD_ACTIONS.forEach((action) => {
      expect(perms.can(action, "Site")).toBe(false)
    })
  })
})

describe("validatePermissionsForManagingUsers", () => {
  beforeEach(async () => {
    await resetTables("IsomerAdmin", "ResourcePermission", "User", "Site")
  })

  it("should allow an Isomer Admin to manage users without any ResourcePermission", async () => {
    // Arrange
    const user = await setupUser({ email: "test@example.com" })
    const { site } = await setupSite()
    await setupIsomerAdmin({ userId: user.id })

    // Act & Assert
    await expect(
      validatePermissionsForManagingUsers({
        action: "manage",
        siteId: site.id,
        userId: user.id,
      }),
    ).resolves.not.toThrow()
  })

  it("should throw FORBIDDEN for a non-admin user without ResourcePermission", async () => {
    // Arrange
    const user = await setupUser({ email: "test@example.com" })
    const { site } = await setupSite()

    // Act & Assert
    await expect(
      validatePermissionsForManagingUsers({
        action: "manage",
        siteId: site.id,
        userId: user.id,
      }),
    ).rejects.toThrow(
      "You do not have sufficient permissions to perform this action",
    )
  })

  it("should throw FORBIDDEN for an expired Isomer Admin without ResourcePermission", async () => {
    // Arrange
    const user = await setupUser({ email: "test@example.com" })
    const { site } = await setupSite()
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    await setupIsomerAdmin({ expiry: yesterday, userId: user.id })

    // Act & Assert
    await expect(
      validatePermissionsForManagingUsers({
        action: "manage",
        siteId: site.id,
        userId: user.id,
      }),
    ).rejects.toThrow(
      "You do not have sufficient permissions to perform this action",
    )
  })
})
