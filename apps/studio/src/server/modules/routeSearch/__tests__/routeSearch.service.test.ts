import { describe, expect, it } from "vitest"

import type { EvaluateStudioRoutes } from "../routeSearch.service"
import { matchStudioRoutes, pickRouteMatches } from "../routeSearch.service"
import { listAccessibleStudioRoutes } from "../studioRoutes"

const memberRoutes = () =>
  listAccessibleStudioRoutes({
    isSiteAdmin: false,
    isIsomerAdmin: false,
    isAuditLogEnabled: false,
  })

describe("listAccessibleStudioRoutes", () => {
  it("omits admin destinations for a site member", () => {
    // Arrange
    const routes = memberRoutes()

    // Act
    const ids = routes.map((route) => route.id)

    // Assert
    expect(ids).toContain("collaborators")
    expect(ids).toContain("settingsIntegrations")
    expect(ids).not.toContain("settingsAuditLog")
    expect(ids).not.toContain("isomerAdmin")
  })

  it("includes audit logs for a site admin only when the flag is on", () => {
    // Arrange
    const withoutFlag = listAccessibleStudioRoutes({
      isSiteAdmin: true,
      isIsomerAdmin: false,
      isAuditLogEnabled: false,
    })
    const withFlag = listAccessibleStudioRoutes({
      isSiteAdmin: true,
      isIsomerAdmin: false,
      isAuditLogEnabled: true,
    })

    // Act
    const withoutIds = withoutFlag.map((route) => route.id)
    const withIds = withFlag.map((route) => route.id)

    // Assert
    expect(withoutIds).not.toContain("settingsAuditLog")
    expect(withoutIds).not.toContain("isomerAdmin")
    expect(withIds).toContain("settingsAuditLog")
    expect(withIds).not.toContain("isomerAdmin")
  })

  it("includes isomer admin settings only for an isomer admin", () => {
    // Arrange
    const routes = listAccessibleStudioRoutes({
      isSiteAdmin: true,
      isIsomerAdmin: true,
      isAuditLogEnabled: true,
    })

    // Act
    const ids = routes.map((route) => route.id)

    // Assert
    expect(ids).toContain("isomerAdmin")
    expect(ids).toContain("settingsAuditLog")
  })
})

describe("matchStudioRoutes", () => {
  it("scores only accessible routes and returns the matching URL", async () => {
    // Arrange
    const routes = memberRoutes()
    let scoredIds: string[] = []
    const evaluateRoutes: EvaluateStudioRoutes = (input) => {
      scoredIds = input.routes.map((route) => route.id)
      return Promise.resolve({ collaborators: 0.91, settingsIntegrations: 0.1 })
    }

    // Act
    const matches = await matchStudioRoutes({
      siteId: "42",
      query: "manage user",
      routes,
      evaluateRoutes,
    })

    // Assert
    expect(scoredIds).not.toContain("settingsAuditLog")
    expect(scoredIds).not.toContain("isomerAdmin")
    expect(
      routes
        .find((route) => route.id === "collaborators")
        ?.description.toLowerCase(),
    ).toContain("user access logs")
    expect(matches).toEqual([
      expect.objectContaining({
        id: "collaborators",
        label: "Collaborators and user access logs",
        href: "/sites/42/users",
      }),
    ])
  })

  it("returns the integrations page for an AskGov query", async () => {
    // Arrange
    const routes = memberRoutes()
    const evaluateRoutes: EvaluateStudioRoutes = () =>
      Promise.resolve({ settingsIntegrations: 0.88, collaborators: 0.12 })

    // Act
    const matches = await matchStudioRoutes({
      siteId: "7",
      query: "add askgov",
      routes,
      evaluateRoutes,
    })

    // Assert
    expect(matches).toEqual([
      expect.objectContaining({
        id: "settingsIntegrations",
        href: "/sites/7/settings/integrations",
      }),
    ])
  })

  it("returns both log destinations above the floor and no third match", () => {
    // Arrange
    const routes = listAccessibleStudioRoutes({
      isSiteAdmin: true,
      isIsomerAdmin: false,
      isAuditLogEnabled: true,
    })

    // Act
    const matches = pickRouteMatches({
      siteId: "7",
      routes,
      probabilities: {
        settingsAuditLog: 0.82,
        collaborators: 0.74,
        settingsFooter: 0.61,
      },
    })

    // Assert
    expect(matches.map((match) => match.id)).toEqual([
      "settingsAuditLog",
      "collaborators",
    ])
    expect(matches.map((match) => match.label)).toEqual([
      "Audit logs",
      "Collaborators and user access logs",
    ])
  })

  it("drops a destination below the floor", () => {
    // Arrange
    const routes = memberRoutes()

    // Act
    const matches = pickRouteMatches({
      siteId: "7",
      routes,
      probabilities: { collaborators: 0.29, settingsIntegrations: 0.3 },
    })

    // Assert
    expect(matches.map((match) => match.id)).toEqual(["settingsIntegrations"])
  })

  it("drops a destination that was not in the allowed set", () => {
    // Arrange
    const routes = memberRoutes()

    // Act
    const matches = pickRouteMatches({
      siteId: "7",
      routes,
      probabilities: { isomerAdmin: 0.99 },
    })

    // Assert
    expect(matches).toEqual([])
  })

  it("returns nothing when every destination is below the floor", async () => {
    // Arrange
    const evaluateRoutes: EvaluateStudioRoutes = () =>
      Promise.resolve({ collaborators: 0.1, settingsIntegrations: 0.2 })

    // Act
    const matches = await matchStudioRoutes({
      siteId: "7",
      query: "speech by minister",
      routes: memberRoutes(),
      evaluateRoutes,
    })

    // Assert
    expect(matches).toEqual([])
  })
})
