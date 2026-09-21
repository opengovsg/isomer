import type { Page } from "@playwright/test"
import { DEFAULT_TAG_CATEGORY_DISPLAY } from "@opengovsg/isomer-components"
import crypto from "crypto"
import {
  GAZETTE_SUBCATEGORY_LABEL,
  governmentGazetteSubcategories,
} from "~/features/gazettes/constants"
import {
  EGAZETTE_INFO_FEATURE_KEY,
  IS_SINGPASS_ENABLED_FEATURE_KEY,
  IS_SINGPASS_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
} from "~/lib/growthbook"
import { db, jsonb } from "~/server/modules/database"
import { ResourceState, ResourceType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS } from "./auth"
import { deleteCollection, uniqueSuffix } from "./collection"
import { getSeedSiteId } from "./seed"

const APPOINTMENTS_OPTION_ID = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"

export const createGazettesCollection = async () => {
  const siteId = getSeedSiteId()
  const suffix = uniqueSuffix()

  const collection = await db
    .insertInto("Resource")
    .values({
      permalink: `e2e-gazettes-collection-${suffix}`,
      siteId,
      parentId: null,
      title: "E2E Gazettes Collection",
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
          title: "E2E Gazettes Collection",
          subtitle: "E2E gazette subcategories",
          tagCategories: [
            {
              label: GAZETTE_SUBCATEGORY_LABEL,
              id: "0e02b2c3-58cc-4372-a567-f47ac10b3d47",
              isRequired: true,
              display: DEFAULT_TAG_CATEGORY_DISPLAY,
              options: [
                {
                  label: governmentGazetteSubcategories.APPOINTMENTS,
                  id: APPOINTMENTS_OPTION_ID,
                },
              ],
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
      permalink: `e2e-gazettes-index-${suffix}`,
      siteId,
      parentId: collection.id,
      title: "E2E Gazettes Index",
      draftBlobId: null,
      state: ResourceState.Draft,
      type: ResourceType.IndexPage,
      publishedVersionId: null,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  const admin = await db
    .selectFrom("User")
    .where("email", "=", TEST_EMAILS.core)
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

  return { siteId, collectionId: collection.id }
}

export const deleteGazettesCollection = (collectionId: string) =>
  deleteCollection(collectionId)

export const stubEgazetteGrowthBook = async (
  page: Page,
  siteId: number,
  gazettesCollectionId: string,
) => {
  await page.route("https://cdn.growthbook.io/**", async (route) => {
    if (!route.request().url().includes("/api/features/")) {
      await route.continue()
      return
    }

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        features: {
          [EGAZETTE_INFO_FEATURE_KEY]: {
            defaultValue: {
              siteId: String(siteId),
              gazettesCollectionId,
            },
          },
          [IS_SINGPASS_ENABLED_FEATURE_KEY]: {
            defaultValue: IS_SINGPASS_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
          },
        },
        dateUpdated: new Date().toISOString(),
      }),
    })
  })
}

/** Presigned gazette uploads go to S3/R2; stub PUT so E2E does not need real object storage. */
export const stubGazetteObjectUpload = async (page: Page) => {
  await page.route("**", async (route) => {
    const request = route.request()
    if (request.method() !== "PUT") {
      await route.continue()
      return
    }

    const url = request.url()
    const isGazetteUpload =
      url.includes("cool-bucket") ||
      url.includes("gazette") ||
      url.includes("X-Amz-Algorithm")

    if (!isGazetteUpload) {
      await route.continue()
      return
    }

    await route.fulfill({ status: 200, body: "" })
  })
}

export const minimalPdfBuffer = () =>
  Buffer.from(
    "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\nxref\n0 3\ntrailer<</Size 3/Root 1 0 R>>\nstartxref\n0\n%%EOF",
  )

export const uniqueGazetteTitle = () =>
  `E2E Gazette ${crypto.randomUUID().slice(0, 8)}`
