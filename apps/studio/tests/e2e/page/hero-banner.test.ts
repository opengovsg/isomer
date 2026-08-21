import { test } from "@playwright/test"
import crypto from "crypto"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { openSeededPageEditor } from "~e2e/fixtures/helpers"
import { seedHomepageHero } from "~e2e/fixtures/resource"
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

  test("admin can edit homepage hero title, subtitle, CTA, and variant, persisted after reload", async ({
    page,
  }) => {
    // Arrange
    const suffix = crypto.randomUUID().slice(0, 8)
    const title = `E2E Hero title ${suffix}`
    const subtitle = `E2E Hero subtitle ${suffix}`
    const buttonLabel = `E2E Hero CTA ${suffix}`
    const buttonUrl = `example-hero-${suffix}.com`
    const { rootPageId } = await seedHomepageHero({
      siteId,
      heroTitle: `E2E seeded hero ${suffix}`,
      variant: "gradient",
      subtitle: "Seeded subtitle",
    })
    const editor = await openSeededPageEditor(page, siteId, rootPageId)

    // Act
    await editor.openHeroEditor()
    await editor.selectHeroVariant("Block")
    await editor.fillFormFieldByLabel("Hero text", title)
    await editor.fillFormFieldByLabel("Description", subtitle)
    await editor.fillFormFieldByLabel(
      "Primary Call-to-Action text",
      buttonLabel,
    )
    await editor.fillButtonDestination(buttonUrl)
    await editor.saveMetaSettings()
    await editor.reload()
    await editor.expectLoaded()

    // Assert — preview iframe
    await editor.expectPreviewContains(title)
    await editor.expectPreviewContains(subtitle)
    await editor.expectPreviewContains(buttonLabel)

    // Assert — reopened hero drawer
    await editor.openHeroEditor()
    await editor.expectFormFieldValue("Hero text", title)
    await editor.expectFormFieldValue("Description", subtitle)
    await editor.expectFormFieldValue(
      "Primary Call-to-Action text",
      buttonLabel,
    )
    await editor.expectButtonDestinationHref(`https://${buttonUrl}`)
  })
})
