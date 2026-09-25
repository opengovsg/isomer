import { describe, expect, it } from "vitest"

import type { EvaluateStudioRoutes } from "../routeSearch.service"
import {
  buildRouteCriteria,
  matchStudioRoutes,
  pickRouteMatches,
} from "../routeSearch.service"
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
  it("sends only accessible routes to Jev and returns the matching URL", async () => {
    // Arrange
    const routes = memberRoutes()
    let criteria: Record<string, string> = {}
    const evaluateRoutes: EvaluateStudioRoutes = (input) => {
      criteria = input.criteria
      return Promise.resolve({
        type: "choice",
        choice: "collaborators",
        probabilities: {
          collaborators: 0.91,
          none: 0.04,
          settingsIntegrations: 0.05,
        },
      })
    }

    // Act
    const matches = await matchStudioRoutes({
      siteId: "42",
      query: "manage user",
      routes,
      evaluateRoutes,
    })

    // Assert
    expect(criteria).not.toHaveProperty("settingsAuditLog")
    expect(criteria).not.toHaveProperty("isomerAdmin")
    expect(criteria.collaborators).toContain("user access logs")
    expect(matches).toEqual([
      expect.objectContaining({
        id: "collaborators",
        label: "Collaborators",
        href: "/sites/42/users",
      }),
    ])
  })

  it("returns the integrations page for an AskGov query", async () => {
    // Arrange
    const routes = memberRoutes()
    const evaluateRoutes: EvaluateStudioRoutes = () =>
      Promise.resolve({
        type: "choice",
        choice: "settingsIntegrations",
        probabilities: { settingsIntegrations: 0.88, none: 0.12 },
      })

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

  it("shows collaborators for a short user query when none is the top choice", () => {
    // Arrange
    const routes = memberRoutes()

    // Act
    const matches = pickRouteMatches({
      siteId: "7",
      routes,
      answer: {
        type: "choice",
        choice: "none",
        probabilities: { none: 0.55, collaborators: 0.22 },
      },
    })

    // Assert
    expect(matches.map((match) => match.id)).toEqual(["collaborators"])
  })

  it("returns the selected route even when its probability is below the extra-match cutoff", () => {
    // Arrange
    const routes = memberRoutes()

    // Act
    const matches = pickRouteMatches({
      siteId: "7",
      routes,
      answer: {
        type: "choice",
        choice: "settingsIntegrations",
        probabilities: { settingsIntegrations: 0.1, none: 0.2 },
      },
    })

    // Assert
    expect(matches.map((match) => match.id)).toEqual(["settingsIntegrations"])
  })

  it("drops a destination Jev names that was not in the allowed set", () => {
    // Arrange
    const routes = memberRoutes()

    // Act
    const matches = pickRouteMatches({
      siteId: "7",
      routes,
      answer: {
        type: "choice",
        choice: "isomerAdmin",
        probabilities: { isomerAdmin: 0.99, none: 0.01 },
      },
    })

    // Assert
    expect(matches).toEqual([])
  })

  it("returns nothing when the query is about page content", async () => {
    // Arrange
    const evaluateRoutes: EvaluateStudioRoutes = () =>
      Promise.resolve({
        type: "choice",
        choice: "none",
        probabilities: { none: 0.9, collaborators: 0.1 },
      })

    // Act
    const matches = await matchStudioRoutes({
      siteId: "7",
      query: "speech by minister",
      routes: memberRoutes(),
      evaluateRoutes,
    })

    // Assert
    expect(matches).toEqual([])
    expect(buildRouteCriteria(memberRoutes()).none).toEqual(expect.any(String))
  })
})
