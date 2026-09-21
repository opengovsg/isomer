import { expect, test } from "@playwright/test"
import { governmentGazetteSubcategories } from "~/features/gazettes/constants"

import { storageStateFor } from "../fixtures/auth"
import {
  createGazettesCollection,
  deleteGazettesCollection,
  minimalPdfBuffer,
  stubEgazetteGrowthBook,
  stubGazetteObjectUpload,
  uniqueGazetteTitle,
} from "../fixtures/gazette"

test.describe("eGazette", () => {
  test.use({ storageState: storageStateFor("core") })

  let collectionId: string
  let siteId: number

  test.beforeEach(async ({ page }) => {
    const collection = await createGazettesCollection()
    siteId = collection.siteId
    collectionId = collection.collectionId

    await stubEgazetteGrowthBook(page, siteId, collectionId)
    await stubGazetteObjectUpload(page)
  })

  test.afterEach(async () => {
    await deleteGazettesCollection(collectionId)
  })

  test("creates a gazette and shows category in the table", async ({
    page,
  }) => {
    const title = uniqueGazetteTitle()
    const notificationNumber = `e2e-${Date.now()}`
    const fileId = `e2e-gazette-${Date.now()}.pdf`

    await page.goto(`/sites/${siteId}/gazettes`)

    await expect(
      page.getByRole("heading", { name: "Government Gazettes" }),
    ).toBeVisible()

    await page.getByRole("button", { name: "Add a new Gazette" }).click()
    await expect(
      page.getByRole("heading", { name: "Add new Gazette" }),
    ).toBeVisible()

    await page.getByPlaceholder("Enter a title").fill(title)
    await page
      .getByPlaceholder("Enter Notification Number")
      .fill(notificationNumber)
    await page.getByPlaceholder("Enter File ID").fill(fileId)

    await page
      .getByRole("group")
      .filter({ hasText: "Subcategory" })
      .getByRole("combobox")
      .click()
    await page
      .getByRole("option", {
        name: governmentGazetteSubcategories.APPOINTMENTS,
      })
      .click()

    await page.locator('input[type="file"]').setInputFiles({
      name: fileId,
      mimeType: "application/pdf",
      buffer: minimalPdfBuffer(),
    })

    await page.getByRole("button", { name: "Add Gazette" }).click()

    await expect(page.getByText("Gazette created successfully")).toBeVisible()

    const row = page.getByRole("row").filter({ hasText: title })
    await expect(row).toBeVisible()
    await expect(row.getByText("Government Gazette")).toBeVisible()
    await expect(
      row.getByText(governmentGazetteSubcategories.APPOINTMENTS),
    ).toBeVisible()
  })
})
