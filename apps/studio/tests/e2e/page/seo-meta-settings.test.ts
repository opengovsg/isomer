import { test } from "@playwright/test"
import crypto from "crypto"
import { fileURLToPath } from "url"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { openSeededPageEditor } from "~e2e/fixtures/helpers"
import {
  mockAssetUploadRoutes,
  mockPresignedPutUrl,
} from "~e2e/fixtures/network"
import { PageSeoSettingsPO } from "~e2e/fixtures/po"
import {
  seedArticlePage,
  seedCollection,
  seedDatabasePage,
  seedFolderIndexPage,
  seedHomepageHero,
  seedRootPage,
} from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

const LOGO_FIXTURE = fileURLToPath(
  new URL("../fixtures/e2e-logo.png", import.meta.url),
)
const LOGO_FILENAME = "e2e-logo.png"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async ({ page }) => {
    await mockAssetUploadRoutes(page)
    await mockPresignedPutUrl(page)
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test("Content layout: meta description, meta image, and noIndex persist after reload", async ({
    page,
  }) => {
    // Arrange
    const description = `E2E SEO description ${crypto.randomUUID().slice(0, 8)}`
    const { page: seededPage } = await seedRootPage({
      siteId,
      pageTitle: `E2E SEO Content ${crypto.randomUUID().slice(0, 8)}`,
    })
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.openSeoSettings()
    const seo = new PageSeoSettingsPO(page)
    await seo.expectLoaded()

    // Act
    await seo.fillMetaDescription(description)
    await seo.uploadMetaImage(LOGO_FIXTURE)
    await seo.expectMetaImageFilename(LOGO_FILENAME)
    await seo.setNoIndex(true)
    await seo.saveByBlur()
    await editor.reload()
    await editor.openSeoSettings()
    await seo.expectLoaded()

    // Assert
    await seo.expectMetaDescription(description)
    await seo.expectMetaImageFilename(LOGO_FILENAME)
    await seo.expectNoIndex(true)
  })

  const LAYOUT_CASES = [
    {
      name: "Article",
      seed: async () => {
        const { page: seededPage } = await seedArticlePage({
          siteId,
          pageTitle: `E2E SEO Article ${crypto.randomUUID().slice(0, 8)}`,
        })
        return seededPage.id
      },
    },
    {
      name: "Index",
      seed: async () => {
        const { indexPage } = await seedFolderIndexPage({
          siteId,
          folderTitle: `E2E SEO Index ${crypto.randomUUID().slice(0, 8)}`,
        })
        return indexPage.id
      },
    },
    {
      name: "Database",
      seed: async () => {
        const { page: seededPage } = await seedDatabasePage({
          siteId,
          pageTitle: `E2E SEO Database ${crypto.randomUUID().slice(0, 8)}`,
        })
        return seededPage.id
      },
    },
    {
      name: "Homepage",
      seed: async () => {
        const { rootPageId } = await seedHomepageHero({ siteId })
        return rootPageId
      },
    },
    {
      name: "Collection Index",
      seed: async () => {
        const { indexPage } = await seedCollection({
          siteId,
          collectionTitle: `E2E SEO Collection ${crypto.randomUUID().slice(0, 8)}`,
        })
        return indexPage.id
      },
    },
  ] as const

  for (const { name, seed } of LAYOUT_CASES) {
    test(`${name} layout: meta description persists after reload`, async ({
      page,
    }) => {
      // Arrange
      const description = `E2E SEO ${name} ${crypto.randomUUID().slice(0, 8)}`
      const pageId = await seed()
      const editor = await openSeededPageEditor(page, siteId, pageId)
      await editor.openSeoSettings()
      const seo = new PageSeoSettingsPO(page)
      await seo.expectLoaded()

      // Act
      await seo.fillMetaDescription(description)
      await seo.saveByBlur()
      await editor.reload()
      await editor.openSeoSettings()
      await seo.expectLoaded()

      // Assert
      await seo.expectMetaDescription(description)
    })
  }
})
