import { describe, expect, it } from "vitest"
import { ResourceType } from "~prisma/generated/generatedEnums"

import { getIsActiveForResource } from "../useIsActive"

describe("getIsActiveForResource", () => {
  it("marks a collection active when the route has the matching collectionId", () => {
    // Arrange
    const resourceId = "456"
    const resourceType = ResourceType.Collection
    const routeParams = { collectionId: "456", siteId: "123" }

    // Act
    const isActive = getIsActiveForResource(
      resourceId,
      resourceType,
      routeParams,
    )

    // Assert
    expect(isActive).toBe(true)
  })

  it("does not mark a collection active when the route has a different collectionId", () => {
    // Arrange
    const resourceId = "456"
    const resourceType = ResourceType.Collection
    const routeParams = { collectionId: "999", siteId: "123" }

    // Act
    const isActive = getIsActiveForResource(
      resourceId,
      resourceType,
      routeParams,
    )

    // Assert
    expect(isActive).toBe(false)
  })

  it("does not mark a collection active when the route has no collectionId", () => {
    // Arrange
    const resourceId = "456"
    const resourceType = ResourceType.Collection
    const routeParams = { siteId: "123" }

    // Act
    const isActive = getIsActiveForResource(
      resourceId,
      resourceType,
      routeParams,
    )

    // Assert
    expect(isActive).toBe(false)
  })

  it("does not mark the root page active when the route has a collectionId", () => {
    // Arrange
    const resourceId = null
    const resourceType = ResourceType.RootPage
    const routeParams = { collectionId: "456", siteId: "123" }

    // Act
    const isActive = getIsActiveForResource(
      resourceId,
      resourceType,
      routeParams,
    )

    // Assert
    expect(isActive).toBe(false)
  })

  it("does not mark the root page active when the route has a folderId", () => {
    // Arrange
    const resourceId = null
    const resourceType = ResourceType.RootPage
    const routeParams = { folderId: "456", siteId: "123" }

    // Act
    const isActive = getIsActiveForResource(
      resourceId,
      resourceType,
      routeParams,
    )

    // Assert
    expect(isActive).toBe(false)
  })

  it("does not mark the root page active when the route has a resourceId", () => {
    // Arrange
    const resourceId = null
    const resourceType = ResourceType.RootPage
    const routeParams = { resourceId: "456", siteId: "123" }

    // Act
    const isActive = getIsActiveForResource(
      resourceId,
      resourceType,
      routeParams,
    )

    // Assert
    expect(isActive).toBe(false)
  })

  it("marks the root page active when there is no routed resource", () => {
    // Arrange
    const resourceId = null
    const resourceType = ResourceType.RootPage
    const routeParams = { siteId: "123" }

    // Act
    const isActive = getIsActiveForResource(
      resourceId,
      resourceType,
      routeParams,
    )

    // Assert
    expect(isActive).toBe(true)
  })

  it("does not mark the root page active when the route has a linkId", () => {
    // Arrange
    const resourceId = null
    const resourceType = ResourceType.RootPage
    const routeParams = { linkId: "789", siteId: "123" }

    // Act
    const isActive = getIsActiveForResource(
      resourceId,
      resourceType,
      routeParams,
    )

    // Assert
    expect(isActive).toBe(false)
  })
})
