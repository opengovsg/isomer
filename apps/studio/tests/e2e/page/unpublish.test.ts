import { expect, test } from "@playwright/test"
import { db } from "~/server/modules/database"
import {
  ResourceType,
  ScheduledAction,
} from "~prisma/generated/generatedEnums"

import { storageStateFor, TEST_EMAILS } from "../fixtures/auth"
import { getRootPageId } from "../fixtures/collection"
import { getSeedSiteId } from "../fixtures/seed"
import {
  createFolder,
  createPublishedPage,
  deleteResourceById,
} from "../fixtures/unpublish"

const WEEK_FROM_NOW = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

// The welcome modal blocks the editor until the user has a name + phone.
const dismissWelcomeModal = (email: string) =>
  db
    .updateTable("User")
    .set({ name: "test-e2e", phone: "82345678" })
    .where("email", "=", email)
    .execute()

const publishedVersionIdOf = (pageId: string) =>
  db
    .selectFrom("Resource")
    .where("id", "=", pageId)
    .select("publishedVersionId")
    .executeTakeFirst()
    .then((r) => r?.publishedVersionId ?? null)

test.describe("admin — unpublish now", () => {
  test.use({ storageState: storageStateFor("admin") })

  let pageId: string

  test.beforeEach(async () => {
    await dismissWelcomeModal(TEST_EMAILS.admin)
    pageId = (await createPublishedPage()).id
  })

  test.afterEach(async () => {
    await deleteResourceById(pageId)
  })

  test("admin can unpublish a live page immediately", async ({ page }) => {
    await page.goto(`/sites/${getSeedSiteId()}/pages/${pageId}`)

    await page.getByRole("button", { name: "More actions" }).click()
    await page.getByRole("button", { name: "Unpublish page" }).click()

    // No default mode on this branch, so pick "now" explicitly by clicking its
    // option card (the radio input itself is visually hidden inside the label).
    await page.locator("label").filter({ hasText: "Unpublish now" }).click()
    await page.getByRole("button", { name: "Unpublish now" }).click()

    await expect(
      page.getByText("Page unpublished successfully"),
    ).toBeVisible()

    // The page is no longer live once unpublished.
    await expect.poll(() => publishedVersionIdOf(pageId)).toBeNull()
  })
})

test.describe("admin — schedule unpublish", () => {
  test.use({ storageState: storageStateFor("admin") })

  let pageId: string

  test.beforeEach(async () => {
    await dismissWelcomeModal(TEST_EMAILS.admin)
    pageId = (await createPublishedPage()).id
  })

  test.afterEach(async () => {
    await deleteResourceById(pageId)
  })

  test("admin can schedule a page to unpublish later", async ({ page }) => {
    await page.goto(`/sites/${getSeedSiteId()}/pages/${pageId}`)

    await page.getByRole("button", { name: "More actions" }).click()
    await page.getByRole("button", { name: "Unpublish page" }).click()

    await page.locator("label").filter({ hasText: "Unpublish later" }).click()

    // A week out, so any time of day is a valid (far-future) schedule.
    const when = WEEK_FROM_NOW()
    const dd = String(when.getDate()).padStart(2, "0")
    const mm = String(when.getMonth() + 1).padStart(2, "0")
    await page
      .getByRole("textbox", { name: "Date" })
      .fill(`${dd}/${mm}/${when.getFullYear()}`)

    // TimeSelect is a react-select: open the combobox and pick an option.
    await page.getByRole("dialog").getByRole("combobox").click()
    await page.getByRole("option", { name: "11:00 AM" }).click()

    await page.getByRole("button", { name: "Schedule unpublish" }).click()

    await expect(page.getByText(/scheduled to unpublish on/i)).toBeVisible()
    await expect
      .poll(() => scheduledActionOf(pageId))
      .toBe(ScheduledAction.Unpublish)
  })
})

const scheduledActionOf = (pageId: string) =>
  db
    .selectFrom("Resource")
    .where("id", "=", pageId)
    .select("scheduledAction")
    .executeTakeFirst()
    .then((r) => r?.scheduledAction ?? null)

test.describe("admin — cancel scheduled unpublish", () => {
  test.use({ storageState: storageStateFor("admin") })

  let pageId: string

  test.beforeEach(async () => {
    await dismissWelcomeModal(TEST_EMAILS.admin)
    pageId = (
      await createPublishedPage({
        scheduledAt: WEEK_FROM_NOW(),
        scheduledAction: ScheduledAction.Unpublish,
      })
    ).id
  })

  test.afterEach(async () => {
    await deleteResourceById(pageId)
  })

  test("admin can cancel a scheduled unpublish", async ({ page }) => {
    await page.goto(`/sites/${getSeedSiteId()}/pages/${pageId}`)

    // A scheduled page is locked for editing; the lock overlay exposes the
    // cancel action directly (the navbar popover offers the same action).
    await page.getByRole("button", { name: "Cancel schedule" }).click()
    await page
      .getByRole("button", { name: "Yes, cancel the schedule" })
      .click()

    await expect(
      page.getByText("Schedule cancelled successfully"),
    ).toBeVisible()
    await expect.poll(() => scheduledActionOf(pageId)).toBeNull()
  })
})

test.describe("admin — home page unpublish disabled", () => {
  test.use({ storageState: storageStateFor("admin") })

  test.beforeEach(async () => {
    await dismissWelcomeModal(TEST_EMAILS.admin)
  })

  test("home page shows Unpublish disabled rather than hidden", async ({
    page,
  }) => {
    const rootPageId = await getRootPageId()
    await page.goto(`/sites/${getSeedSiteId()}/pages/${rootPageId}`)

    await page.getByRole("button", { name: "More actions" }).click()

    await expect(
      page.getByText("This page can't be unpublished"),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Unpublish page" }),
    ).toBeDisabled()
  })
})

test.describe("admin — container with a live child blocks unpublish", () => {
  test.use({ storageState: storageStateFor("admin") })

  let folderId: string
  let indexPageId: string

  test.beforeEach(async () => {
    await dismissWelcomeModal(TEST_EMAILS.admin)
    folderId = (await createFolder()).id
    indexPageId = (
      await createPublishedPage({
        type: ResourceType.IndexPage,
        parentId: folderId,
      })
    ).id
    // A live child under the same folder is what blocks the landing page.
    await createPublishedPage({ type: ResourceType.Page, parentId: folderId })
  })

  test.afterEach(async () => {
    // Cascades to the index page and child.
    await deleteResourceById(folderId)
  })

  test("landing page with a live child can't be unpublished", async ({
    page,
  }) => {
    await page.goto(`/sites/${getSeedSiteId()}/pages/${indexPageId}`)

    await page.getByRole("button", { name: "More actions" }).click()

    await expect(
      page.getByText("There are child pages that are or will be live"),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Unpublish page" }),
    ).toBeDisabled()
  })
})

test.describe("editor — no unpublish permission", () => {
  test.use({ storageState: storageStateFor("editor") })

  let pageId: string

  test.beforeEach(async () => {
    await dismissWelcomeModal(TEST_EMAILS.editor)
    pageId = (await createPublishedPage()).id
  })

  test.afterEach(async () => {
    await deleteResourceById(pageId)
  })

  test("editor sees the more-actions button disabled with a tooltip", async ({
    page,
  }) => {
    await page.goto(`/sites/${getSeedSiteId()}/pages/${pageId}`)

    const moreActions = page.getByRole("button", { name: "More actions" })
    await expect(moreActions).toBeDisabled()

    await moreActions.hover()
    await expect(
      page.getByRole("tooltip", {
        name: "You need to be a Publisher or Admin to unpublish.",
      }),
    ).toBeVisible()
  })
})
