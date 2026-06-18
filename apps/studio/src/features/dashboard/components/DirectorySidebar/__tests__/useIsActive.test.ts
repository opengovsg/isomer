import { describe, expect, it } from "vitest"

import { ResourceType } from "~prisma/generated/generatedEnums"

import { getIsActiveForResource } from "../useIsActive"

describe("getIsActiveForResource", () => {
  it("marks a collection active when the route has the matching collectionId", () => {
    // Arrange + Act
    const isActive = getIsActiveForResource("456", ResourceType.Collection, {
      collectionId: "456",
      siteId: "123",
    })

    // Assert
    expect(isActive).toBe(true)
  })

  it("does not mark the root page active when the route has a collectionId", () => {
    // Arrange + Act
    const isActive = getIsActiveForResource(null, ResourceType.RootPage, {
      collectionId: "456",
      siteId: "123",
    })

    // Assert
    expect(isActive).toBe(false)
  })

  it("marks the root page active when there is no routed resource", () => {
    // Arrange + Act
    const isActive = getIsActiveForResource(null, ResourceType.RootPage, {
      siteId: "123",
    })

    // Assert
    expect(isActive).toBe(true)
  })

  it("does not mark the root page active when the route has a linkId", () => {
    // Arrange + Act
    const isActive = getIsActiveForResource(null, ResourceType.RootPage, {
      linkId: "789",
      siteId: "123",
    })

    // Assert
    expect(isActive).toBe(false)
  })
})
