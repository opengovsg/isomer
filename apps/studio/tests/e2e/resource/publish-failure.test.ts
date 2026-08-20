import { expect, test } from "@playwright/test"
import { seedFolderWithPage } from "~e2e/fixtures/resource"
import { getResource } from "~e2e/fixtures/resource"
import { deleteRedirectBySource, seedRedirect } from "~e2e/fixtures/site"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { ResourceState, RoleType } from "~prisma/generated/generatedEnums"

import { roleTag, TEST_EMAILS } from "../fixtures/auth"
import { openSeededPageEditor } from "../fixtures/helpers"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Publisher] })
  siteId = site.siteId
})

test.describe("publisher", { tag: roleTag("publisher") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.publisher)
  })

  test("publish failure shows an error and preserves the draft", async ({
    page,
  }) => {
    // Arrange: a page whose first-publish URL is already occupied by a live
    // redirect — publishPageResource rejects this with a CONFLICT, the one
    // deterministic, UI-visible publish failure this app produces.
    const { folder, page: seededPage } = await seedFolderWithPage({ siteId })
    const fullPermalink = `/${folder.permalink}/${seededPage.permalink}`
    await seedRedirect({
      siteId,
      source: fullPermalink,
      destination: "https://example.com",
    })

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
  })

  test("publish succeeds after removing the blocking redirect", async ({
    page,
  }) => {
    // Arrange: same redirect conflict, failed publish dismissed, blocker removed
    const { folder, page: seededPage } = await seedFolderWithPage({ siteId })
    const fullPermalink = `/${folder.permalink}/${seededPage.permalink}`
    await seedRedirect({
      siteId,
      source: fullPermalink,
      destination: "https://example.com",
    })
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.clickPublish()
    await expect(
      page.getByText(
        `Can't publish — a redirect already exists at ${fullPermalink}. Remove it on the Redirections page first.`,
      ),
    ).toBeVisible()
    await page.getByRole("button", { name: "No, don't publish" }).click()
    await deleteRedirectBySource({ siteId, source: fullPermalink })

    // Act
    await editor.clickPublish()
    await editor.expectPublishedToast()

    // Assert
    await expect
      .poll(async () => (await getResource(seededPage.id))?.state)
      .toBe(ResourceState.Published)
    await expect
      .poll(async () => (await getResource(seededPage.id))?.draftBlobId)
      .toBeNull()
  })
})
