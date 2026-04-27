import { describe, expect, it } from "vitest"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

import { getVisibleGodmodeLinks } from "../utils"

describe("getVisibleGodmodeLinks", () => {
  it("shows all God Mode links to core admins", () => {
    // Act
    const links = getVisibleGodmodeLinks([IsomerAdminRole.Core])

    // Assert
    expect(links.map((link) => link.label)).toStrictEqual([
      "Create a new site",
      "Publishing",
      "Whitelist",
    ])
  })

  it("shows only whitelist access to migrators", () => {
    // Act
    const links = getVisibleGodmodeLinks([IsomerAdminRole.Migrator])

    // Assert
    expect(links.map((link) => link.href)).toStrictEqual([
      "/godmode/whitelist",
    ])
  })

  it("shows no links without a God Mode role", () => {
    // Act
    const links = getVisibleGodmodeLinks([])

    // Assert
    expect(links).toStrictEqual([])
  })
})
