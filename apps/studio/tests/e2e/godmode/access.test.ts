import { test } from "@playwright/test"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { GodmodePO } from "~e2e/fixtures/po"
import { ensureUserOnboarded } from "~e2e/fixtures/user"

const RESTRICTED_GODMODE_PATHS = [
  "/godmode",
  "/godmode/create-site",
  "/godmode/publishing",
  "/godmode/whitelist",
] as const

test.describe("core", { tag: roleTag("core") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.core)
  })

  test("core admin can access the godmode hub", async ({ page }) => {
    const godmode = new GodmodePO(page)

    // Act
    await godmode.gotoHub()

    // Assert
    await godmode.expectHubLinkVisible("Create a new site")
    await godmode.expectHubLinkVisible("Publishing")
    await godmode.expectHubLinkVisible("Whitelist")
  })
})

test.describe("migrator", { tag: roleTag("migrator") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.migrator)
  })

  test("migrator can only access whitelist godmode routes", async ({
    page,
  }) => {
    const godmode = new GodmodePO(page)

    // Act
    await godmode.gotoHub()

    // Assert
    await godmode.expectHubLinkVisible("Whitelist")
    await godmode.expectHubLinkHidden("Create a new site")
    await godmode.expectHubLinkHidden("Publishing")

    await godmode.gotoWhitelist()

    await godmode.expectRedirectToDashboard("/godmode/create-site")
    await godmode.expectRedirectToDashboard("/godmode/publishing")
  })
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test("editor without godmode access is redirected", async ({ page }) => {
    const godmode = new GodmodePO(page)

    // Act / Assert
    for (const path of RESTRICTED_GODMODE_PATHS) {
      await godmode.expectRedirectToDashboard(path)
    }
  })
})

test.describe("publisher", { tag: roleTag("publisher") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.publisher)
  })

  test("publisher without godmode access is redirected", async ({ page }) => {
    const godmode = new GodmodePO(page)

    // Act / Assert
    for (const path of RESTRICTED_GODMODE_PATHS) {
      await godmode.expectRedirectToDashboard(path)
    }
  })
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test("site admin without godmode access is redirected", async ({ page }) => {
    const godmode = new GodmodePO(page)

    // Act / Assert
    for (const path of RESTRICTED_GODMODE_PATHS) {
      await godmode.expectRedirectToDashboard(path)
    }
  })
})

test.describe("nomember", { tag: roleTag("nomember") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.nomember)
  })

  test("nomember without godmode access is redirected", async ({ page }) => {
    const godmode = new GodmodePO(page)

    // Act / Assert
    for (const path of RESTRICTED_GODMODE_PATHS) {
      await godmode.expectRedirectToDashboard(path)
    }
  })
})
