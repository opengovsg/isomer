import { expect, test, type Page } from "@playwright/test"
import crypto from "crypto"
import { db, jsonb } from "~/server/modules/database"
import { ResourceState, ResourceType } from "~prisma/generated/generatedEnums"

import { storageStateFor, TEST_EMAILS } from "../fixtures/auth"
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

const uniqueSuffix = () => crypto.randomUUID().slice(0, 8)

const readBlobContent = async (blobId: string) => {
  const blob = await db
    .selectFrom("Blob")
    .where("id", "=", blobId)
    .select("content")
    .executeTakeFirstOrThrow()
  return blob.content as unknown as { page: { tagged?: string[] } }
}

// `collection.getCollectionTags` (the query both drawers use to know which
// tag categories exist) only ever reads the index page's *published* blob —
// there is no draft fallback. So the tag category has to be published here,
// not just drafted, or the drawers under test won't see it at all.
const createCollectionWithRequiredTagCategory = async () => {
  const suffix = uniqueSuffix()

  const collection = await db
    .insertInto("Resource")
    .values({
      permalink: `e2e-tags-collection-${suffix}`,
      siteId,
      parentId: null,
      title: "E2E Tags Collection",
      draftBlobId: null,
      state: ResourceState.Draft,
      type: ResourceType.Collection,
      publishedVersionId: null,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  const indexBlob = await db
    .insertInto("Blob")
    .values({
      content: jsonb({
        layout: "collection",
        page: {
          title: "E2E Tags Collection",
          subtitle: "E2E test subtitle",
          tagCategories: [
            {
              id: TAG_CATEGORY_ID,
              label: TAG_CATEGORY_LABEL,
              isRequired: true,
              options: [{ id: TAG_OPTION_ID, label: TAG_OPTION_LABEL }],
            },
          ],
        },
        content: [],
        version: "0.1.0",
      }),
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  const indexPage = await db
    .insertInto("Resource")
    .values({
      permalink: `e2e-tags-index-${suffix}`,
      siteId,
      parentId: collection.id,
      title: "E2E Tags Index",
      draftBlobId: null,
      state: ResourceState.Draft,
      type: ResourceType.IndexPage,
      publishedVersionId: null,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  const admin = await db
    .selectFrom("User")
    .where("email", "=", TEST_EMAILS.admin)
    .select("id")
    .executeTakeFirstOrThrow()

  const version = await db
    .insertInto("Version")
    .values({
      versionNum: 1,
      resourceId: indexPage.id,
      blobId: indexBlob.id,
      publishedBy: admin.id,
    })
    .returning("id")
    .executeTakeFirstOrThrow()

  await db
    .updateTable("Resource")
    .where("id", "=", indexPage.id)
    .set({ publishedVersionId: version.id })
    .execute()

  return collection
}

// Cascades to the index page and any collection items (Resource.parent is
// onDelete: Cascade).
const deleteCollection = (collectionId: string) =>
  db.deleteFrom("Resource").where("id", "=", collectionId).execute()

// Both LinkEditorDrawer and MetadataEditorStateDrawer render the required
// tag category through the same JsonFormsTaggedControl multi-select.
const selectRequiredTagOption = async (page: Page) => {
  await page.getByLabel(TAG_CATEGORY_LABEL).click()
  await page.getByRole("option", { name: TAG_OPTION_LABEL }).click()
  await page.keyboard.press("Escape")
}

test.describe("collection link — required tag categories", () => {
  test.use({ storageState: storageStateFor("admin") })

  let collectionId: string
  let linkId: string

  test.beforeEach(async () => {
    await dismissWelcomeModal(TEST_EMAILS.admin)
    const collection = await createCollectionWithRequiredTagCategory()
    collectionId = collection.id

    // Save is also gated on a non-empty, valid `ref` — seed one directly so
    // the test isolates the tag-category gate instead of driving the
    // separate link-picker UI.
    const rootPage = await db
      .selectFrom("Resource")
      .where("siteId", "=", siteId)
      .where("type", "=", ResourceType.RootPage)
      .select("id")
      .executeTakeFirstOrThrow()

    const blob = await db
      .insertInto("Blob")
      .values({
        content: jsonb({
          layout: "link",
          page: {
            ref: `[resource:${siteId}:${rootPage.id}]`,
            summary: "",
            category: "",
            date: "01/01/2026",
          },
          content: [],
          version: "0.1.0",
        }),
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    const link = await db
      .insertInto("Resource")
      .values({
        permalink: `e2e-tags-link-${uniqueSuffix()}`,
        siteId,
        parentId: collectionId,
        title: "E2E Tags Link",
        type: ResourceType.CollectionLink,
        state: ResourceState.Draft,
        draftBlobId: blob.id,
        publishedVersionId: null,
      })
      .returningAll()
      .executeTakeFirstOrThrow()
    linkId = link.id
  })

  test.afterEach(async () => {
    await deleteCollection(collectionId)
  })

  test("admin can save after filling the required tag category", async ({
    page,
  }) => {
    await page.goto(`/sites/${siteId}/links/${linkId}`)

    const saveButton = page.getByRole("button", { name: "Save", exact: true })
    await expect(saveButton).toBeDisabled()

    await selectRequiredTagOption(page)
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
    await page.goto(`/sites/${siteId}/links/${linkId}`)

    await expect(
      page.getByRole("button", { name: "Save", exact: true }),
    ).toBeDisabled()
    await expect(
      page.getByText("At least one option must be selected"),
    ).toBeVisible()
  })
})

test.describe("collection page — required tag categories", () => {
  test.use({ storageState: storageStateFor("admin") })

  let collectionId: string
  let pageId: string

  test.beforeEach(async () => {
    await dismissWelcomeModal(TEST_EMAILS.admin)
    const collection = await createCollectionWithRequiredTagCategory()
    collectionId = collection.id

    const blob = await db
      .insertInto("Blob")
      .values({
        content: jsonb({
          layout: "article",
          page: {
            date: "01/01/2026",
            category: "Feature Articles",
            articlePageHeader: {
              summary: "E2E test summary",
            },
          },
          content: [],
          version: "0.1.0",
        }),
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    const collectionPage = await db
      .insertInto("Resource")
      .values({
        permalink: `e2e-tags-page-${uniqueSuffix()}`,
        siteId,
        parentId: collectionId,
        title: "E2E Tags Page",
        type: ResourceType.CollectionPage,
        state: ResourceState.Draft,
        draftBlobId: blob.id,
        publishedVersionId: null,
      })
      .returningAll()
      .executeTakeFirstOrThrow()
    pageId = collectionPage.id
  })

  test.afterEach(async () => {
    await deleteCollection(collectionId)
  })

  test("admin can save after filling the required tag category", async ({
    page,
  }) => {
    await page.goto(`/sites/${siteId}/pages/${pageId}`)
    await page.getByRole("button", { name: "Article page header" }).click()

    const saveButton = page.getByRole("button", {
      name: "Save changes",
      exact: true,
    })
    await expect(saveButton).toBeDisabled()

    await selectRequiredTagOption(page)
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
    await page.goto(`/sites/${siteId}/pages/${pageId}`)
    await page.getByRole("button", { name: "Article page header" }).click()

    await expect(
      page.getByRole("button", { name: "Save changes", exact: true }),
    ).toBeDisabled()
    await expect(
      page.getByText("At least one option must be selected"),
    ).toBeVisible()
  })
})
