import { test } from "@playwright/test"
import crypto from "crypto"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { openSeededPageEditor } from "~e2e/fixtures/helpers"
import { E2E_DGS_DATASET_ID, mockDgsApis } from "~e2e/fixtures/network"
import { seedDatabasePage } from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

const DGS_DATASET_URL = `https://data.gov.sg/datasets/${E2E_DGS_DATASET_ID}/view`

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async ({ page }) => {
    await mockDgsApis(page)
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test("admin can link a data.gov.sg dataset and set a table title, persisted after reload", async ({
    page,
  }) => {
    // Arrange
    const tableTitle = `E2E Database table ${crypto.randomUUID().slice(0, 8)}`
    const { page: seededPage } = await seedDatabasePage({
      siteId,
      pageTitle: `E2E Database DGS ${crypto.randomUUID().slice(0, 8)}`,
    })
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)

    // Act
    await editor.openDatabaseEditor()
    await editor.openDgsDatasetModal()
    await editor.fillDgsDatasetUrl(DGS_DATASET_URL)
    await editor.expectValidCsvDataset()
    await editor.saveDgsDatasetId()
    await editor.fillFormFieldByLabel("Title", tableTitle)
    await editor.saveMetaSettings()
    await editor.reload()
    await editor.expectLoaded()

    // Assert — preview shows the saved table title (from blob, not DGS APIs).
    // Column headers/rows need a second async metadata + datastore_search
    // round-trip in the preview; that integration is covered in components
    // tests — this E2E focuses on linking a dataset and persisting editor state.
    await editor.expectPreviewContains(tableTitle)

    // Assert — reopened database drawer
    await editor.openDatabaseEditor()
    await editor.expectFormFieldValue("Title", tableTitle)
    await editor.expectDgsDatasetUrlContains(E2E_DGS_DATASET_ID)
  })
})
