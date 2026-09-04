import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { db } from "~/server/modules/database"

import { storageStateFor, TEST_EMAILS } from "../fixtures/auth"
import {
  createCollectionLink,
  createCollectionPage,
  createCollectionWithTagCategories,
  deleteCollection,
  getRootPageId,
  readBlobContent,
} from "../fixtures/collection"
import { CollectionPO } from "../fixtures/collection.po"
import { getSeedSiteId } from "../fixtures/seed"

const siteId = getSeedSiteId()

const dismissWelcomeModal = (email: string) =>
  db
    .updateTable("User")
    .set({ name: "test-e2e", phone: "82345678" })
    .where("email", "=", email)
    .execute()

// Shared across every test in this file: one required tag category with a
// single option, so both drawers have something to validate against.
const TAG_CATEGORY_ID = crypto.randomUUID()
const TAG_OPTION_ID = crypto.randomUUID()
const TAG_CATEGORY_LABEL = "Topic"
const TAG_OPTION_LABEL = "Technology"

test.describe("collection link — required tag categories", () => {
  test.use({ storageState: storageStateFor("admin") })

  let collectionId: string
  let linkId: string

  test.beforeEach(async () => {
    await dismissWelcomeModal(TEST_EMAILS.admin)
    const collection = await createCollectionWithTagCategories([
      {
        id: TAG_CATEGORY_ID,
        label: TAG_CATEGORY_LABEL,
        isRequired: true,
        options: [{ id: TAG_OPTION_ID, label: TAG_OPTION_LABEL }],
      },
    ])
    collectionId = collection.collectionId

    // Save is also gated on a non-empty, valid `ref` — seed one directly so
    // the test isolates the tag-category gate instead of driving the
    // separate link-picker UI.
    const rootPageId = await getRootPageId()
    const link = await createCollectionLink({
      collectionId,
      ref: `[resource:${siteId}:${rootPageId}]`,
    })
    linkId = link.id
  })

  test.afterEach(async () => {
    await deleteCollection(collectionId)
  })

  test("admin can save after filling the required tag category", async ({
    page,
  }) => {
    const collection = new CollectionPO(page)
    await page.goto(`/sites/${siteId}/links/${linkId}`)

    const saveButton = page.getByRole("button", { name: "Save", exact: true })
    await expect(saveButton).toBeDisabled()

    await collection.selectTagOption(TAG_CATEGORY_LABEL, TAG_OPTION_LABEL)
    await expect(saveButton).toBeEnabled()

    await saveButton.click()
    await expect(page.getByText("Link updated!")).toBeVisible()

    const resource = await db
      .selectFrom("Resource")
      .where("id", "=", linkId)
      .select("draftBlobId")
      .executeTakeFirstOrThrow()
    const content = await readBlobContent(resource.draftBlobId!)
    expect(content.page.tagged).toContain(TAG_OPTION_ID)
  })

  test("save stays disabled while the required tag category is unfilled", async ({
    page,
  }) => {
    const collection = new CollectionPO(page)
    await page.goto(`/sites/${siteId}/links/${linkId}`)

    await expect(
      page.getByRole("button", { name: "Save", exact: true }),
    ).toBeDisabled()
    await collection.expectRequiredTagError()
  })
})

test.describe("collection page — required tag categories", () => {
  test.use({ storageState: storageStateFor("admin") })

  let collectionId: string
  let pageId: string

  test.beforeEach(async () => {
    await dismissWelcomeModal(TEST_EMAILS.admin)
    const collection = await createCollectionWithTagCategories([
      {
        id: TAG_CATEGORY_ID,
        label: TAG_CATEGORY_LABEL,
        isRequired: true,
        options: [{ id: TAG_OPTION_ID, label: TAG_OPTION_LABEL }],
      },
    ])
    collectionId = collection.collectionId

    const collectionPage = await createCollectionPage({ collectionId })
    pageId = collectionPage.id
  })

  test.afterEach(async () => {
    await deleteCollection(collectionId)
  })

  test("admin can save after filling the required tag category", async ({
    page,
  }) => {
    const collection = new CollectionPO(page)
    await page.goto(`/sites/${siteId}/pages/${pageId}`)
    await page.getByRole("button", { name: "Article page header" }).click()

    const saveButton = page.getByRole("button", {
      name: "Save changes",
      exact: true,
    })
    await expect(saveButton).toBeDisabled()

    await collection.selectTagOption(TAG_CATEGORY_LABEL, TAG_OPTION_LABEL)
    await expect(saveButton).toBeEnabled()

    await saveButton.click()
    await expect(
      page.getByText(
        "Changes saved. Click 'Publish' when you're ready to go live.",
      ),
    ).toBeVisible()

    const resource = await db
      .selectFrom("Resource")
      .where("id", "=", pageId)
      .select("draftBlobId")
      .executeTakeFirstOrThrow()
    const content = await readBlobContent(resource.draftBlobId!)
    expect(content.page.tagged).toContain(TAG_OPTION_ID)
  })

  test("save stays disabled while the required tag category is unfilled", async ({
    page,
  }) => {
    const collection = new CollectionPO(page)
    await page.goto(`/sites/${siteId}/pages/${pageId}`)
    await page.getByRole("button", { name: "Article page header" }).click()

    await expect(
      page.getByRole("button", { name: "Save changes", exact: true }),
    ).toBeDisabled()
    await collection.expectRequiredTagError()
  })
})
