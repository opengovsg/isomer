import { resetTables } from "tests/integration/helpers/db"
import { setupSite } from "tests/integration/helpers/seed"
import { beforeEach, describe, expect, it } from "vitest"

import { db } from "~/server/modules/database"
import { jsonb } from "~/server/modules/database/utils"
import { NAVBAR_CONTENT } from "~/server/modules/site/constants"
import { updateNavbarToIncludeCallToAction } from "../updateNavbarToIncludeCallToAction"

describe("Migration: updateNavbarToIncludeCallToAction", () => {
  beforeEach(async () => {
    await resetTables("Navbar", "Site")
  })

  it("should wrap Navbar.content in { items: ... } if it is an array", async () => {
    // Arrange
    const { site, navbar } = await setupSite()
    await db
      .updateTable("Navbar")
      .set({ content: jsonb(NAVBAR_CONTENT.items) as unknown as any }) // any needed to bypass type checking for old type
      .where("siteId", "=", site.id)
      .returningAll()
      .executeTakeFirstOrThrow()

    // Act
    await updateNavbarToIncludeCallToAction(db)

    // Assert
    const updatedNavbar = await db
      .selectFrom("Navbar")
      .where("id", "=", navbar.id)
      .select("content")
      .executeTakeFirstOrThrow()
    expect(updatedNavbar.content).toEqual(NAVBAR_CONTENT)
  })

  it("should NOT change Navbar.content if it already has { items: ... }", async () => {
    // Arrange
    const { site } = await setupSite()
    const navbar = await db
      .updateTable("Navbar")
      .set({ content: jsonb(NAVBAR_CONTENT) })
      .where("siteId", "=", site.id)
      .returningAll()
      .executeTakeFirstOrThrow()

    // Act
    await updateNavbarToIncludeCallToAction(db)

    // Assert
    const queriedNavbar = await db
      .selectFrom("Navbar")
      .where("id", "=", navbar.id)
      .selectAll()
      .executeTakeFirstOrThrow()
    expect(queriedNavbar.content).toEqual(NAVBAR_CONTENT)
  })

  it("should not update Navbar.content if it is null", async () => {
    // Arrange
    const { site } = await setupSite()
    const navbar = await db
      .updateTable("Navbar")
      .set({ content: jsonb(null) as any })
      .where("siteId", "=", site.id)
      .returningAll()
      .executeTakeFirstOrThrow()

    // Act
    await updateNavbarToIncludeCallToAction(db)

    // Assert
    const updatedNavbar = await db
      .selectFrom("Navbar")
      .where("id", "=", navbar.id)
      .selectAll()
      .executeTakeFirstOrThrow()
    expect(updatedNavbar.content).toEqual(null)
  })
})
