import { expect, test } from "@playwright/test"
import { normalizeRedirectSource } from "~/schemas/redirect/utils"
import { db } from "~/server/modules/database"
import { ResourceState, RoleType } from "~prisma/generated/generatedEnums"

import { roleTag, TEST_EMAILS } from "../fixtures/auth"
import { openSeededPageEditor } from "../fixtures/helpers"
import { seedFolderWithPage } from "../fixtures/page-seed"
import { getResource } from "../fixtures/resource.db"
import { provisionE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Publisher] })
  siteId = site.siteId
})

test.describe("publisher", { tag: roleTag("publisher") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.publisher)
  })

  test("publish failure shows an error, preserves the draft, and allows retry", async ({
    page,
  }) => {
    // Arrange: a page whose first-publish URL is already occupied by a live
    // redirect — publishPageResource rejects this with a CONFLICT, the one
    // deterministic, UI-visible publish failure this app produces.
    const { folder, page: seededPage } = await seedFolderWithPage({ siteId })
    const fullPermalink = `/${folder.permalink}/${seededPage.permalink}`
    await db
      .insertInto("Redirect")
      .values({
        siteId,
        source: normalizeRedirectSource(fullPermalink),
        destination: "https://example.com",
      })
      .execute()

    // Act: publishing fails on the conflicting redirect. The confirmation
    // modal only auto-closes on success, so it's still open behind the toast.
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.clickPublish()
    await expect(
      page.getByText(
        `Can't publish — a redirect already exists at ${fullPermalink}. Remove it on the Redirections page first.`,
      ),
    ).toBeVisible()
    await page.getByRole("button", { name: "No, don't publish" }).click()

    // Assert: the draft is untouched by the failed attempt
    await editor.expectPublishButtonEnabled()
    await expect
      .poll(async () => (await getResource(seededPage.id))?.state)
      .toBe(ResourceState.Draft)
    await expect
      .poll(async () => (await getResource(seededPage.id))?.draftBlobId)
      .not.toBeNull()

    // Act: remove the blocking redirect and retry
    await db
      .deleteFrom("Redirect")
      .where("siteId", "=", siteId)
      .where("source", "=", normalizeRedirectSource(fullPermalink))
      .execute()
    await editor.clickPublish()
    await editor.expectPublishedToast()

    // Assert: the retry succeeds
    await expect
      .poll(async () => (await getResource(seededPage.id))?.state)
      .toBe(ResourceState.Published)
    await expect
      .poll(async () => (await getResource(seededPage.id))?.draftBlobId)
      .toBeNull()
  })
})
