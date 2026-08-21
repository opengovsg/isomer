import { test } from "@playwright/test"
import crypto from "crypto"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { openSeededPageEditor } from "~e2e/fixtures/helpers"
import {
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

  test("admin can apply a heading and bold/italic/underline formatting in a prose block, persisting after reload", async ({
    page,
  }) => {
    // Arrange
    const suffix = crypto.randomUUID().slice(0, 8)
    const headingText = `Heading ${suffix}`
    const formattedText = `Formatted run ${suffix}`
    const { page: seededPage } = await seedFolderWithPage({ siteId })

    // Act
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.openBlockEditor(SEEDED_PROSE_BLOCK_LABEL)
    await editor.clearProseContent()
    await editor.typeProseLine(headingText)
    await editor.typeProseLastLine(formattedText)
    // Apply inline marks before block-level heading conversion — converting
    // the first line to H2 can leave TipTap's selection on the heading, which
    // makes subsequent triple-click formatting on the next line flaky in CI.
    await editor.applyInlineFormatting(formattedText)
    await editor.applyHeading(headingText, 2)
    await editor.saveBlockChanges()
    await editor.reload()
    await editor.expectLoaded()

    // Assert — preview iframe (published-site renderer)
    await editor.expectPreviewHeading(2, headingText)
    await editor.expectPreviewBoldVisible(formattedText)
    await editor.expectPreviewItalicVisible(formattedText)
    await editor.expectPreviewUnderlineVisible(formattedText)

    // Assert — reopened editor pane (TipTap's own rendering)
    await editor.openBlockEditor(headingText)
    await editor.expectEditorHeadingVisible(2, headingText)
    await editor.expectEditorBoldVisible(formattedText)
    await editor.expectEditorItalicVisible(formattedText)
    await editor.expectEditorUnderlineVisible(formattedText)
  })

  test("admin can insert an external link and a bulleted list in a prose block, persisting after reload", async ({
    page,
  }) => {
    // Arrange
    const suffix = crypto.randomUUID().slice(0, 8)
    const linkText = `Link text ${suffix}`
    const listItemText = `List item ${suffix}`
    const urlWithoutProtocol = `example.com/${suffix}`
    const { page: seededPage } = await seedFolderWithPage({ siteId })

    // Act
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.openBlockEditor(SEEDED_PROSE_BLOCK_LABEL)
    await editor.clearProseContent()
    await editor.typeProseLine(linkText)
    await editor.typeProseLastLine(listItemText)
    await editor.insertLink(linkText, urlWithoutProtocol)
    await editor.insertBulletedList(listItemText)
    await editor.saveBlockChanges()
    await editor.reload()
    await editor.expectLoaded()

    // Assert — preview iframe (published-site renderer)
    await editor.expectPreviewLink(linkText, `https://${urlWithoutProtocol}`)
    await editor.expectPreviewBulletedList(listItemText)

    // Assert — reopened editor pane (TipTap's own rendering)
    await editor.openBlockEditor(listItemText)
    await editor.expectEditorLinkVisible(linkText)
    await editor.expectEditorBulletedListVisible(listItemText)
  })
})
