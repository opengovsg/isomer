import { test } from "@playwright/test"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { openSeededPageEditor, withRoleSession } from "~e2e/fixtures/helpers"
import { PageEditorPO } from "~e2e/fixtures/po"
import {
  SEEDED_CALLOUT_BLOCK_LABEL,
  SEEDED_PROSE_BLOCK_LABEL,
  seedFolderWithPage,
} from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test("a session reordering from stale state gets a conflict toast and rolls back, after another session's reorder already saved", async ({
    page,
    browser,
  }) => {
    // Arrange: seed a page with two distinct blocks, then open it in two
    // independent sessions — both load the same pre-reorder block order.
    const { page: seededPage } = await seedFolderWithPage({ siteId })
    const session1 = await openSeededPageEditor(page, siteId, seededPage.id)

    await withRoleSession(browser, "admin", async ({ page: page2 }) => {
      const session2 = new PageEditorPO(page2)
      await session2.gotoPage(siteId, seededPage.id)
      await session2.expectLoaded()

      // Arrange: session 1 reorders and its change is persisted. Session 2
      // (opened above, before this reorder happened) still holds the
      // pre-reorder order in memory, since it never reloaded.
      await session1.reorderBlockDownAndWaitForPersist(SEEDED_PROSE_BLOCK_LABEL)

      // Act: session 2 attempts a reorder based on its now-stale state —
      // this conflicts with the DB state session 1 already changed.
      await session2.reorderBlockDown(SEEDED_PROSE_BLOCK_LABEL)

      // Assert: session 2 surfaces the conflict via the generic error toast,
      // and rolls back to the order it displayed before its own failed
      // attempt, rather than silently applying an incorrect reorder.
      await session2.expectReorderConflictToast()
      await session2.expectBlockOrder([
        SEEDED_PROSE_BLOCK_LABEL,
        SEEDED_CALLOUT_BLOCK_LABEL,
      ])
    })
  })
})
