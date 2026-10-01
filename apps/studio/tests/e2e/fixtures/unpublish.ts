import { db, jsonb } from "~/server/modules/database"
import {
  ResourceState,
  ResourceType,
  type ScheduledAction,
} from "~prisma/generated/generatedEnums"

import { TEST_EMAILS } from "./auth"
import { uniqueSuffix } from "./collection"
import { getSeedSiteId } from "./seed"

const getAdminId = async () =>
  (
    await db
      .selectFrom("User")
      .where("email", "=", TEST_EMAILS.admin)
      .select("id")
      .executeTakeFirstOrThrow()
  ).id

// A minimal published content page: mirrors the shape of a real content-layout
// blob so the editor renders it. Inserts the Blob + Version and points
// publishedVersionId at it, so the page reads as live (publishedVersionId set).
export const createPublishedPage = async ({
  title = `E2E Unpublish Page ${uniqueSuffix()}`,
  parentId = null,
  type = ResourceType.Page,
  scheduledAt = null,
  scheduledAction = null,
}: {
  title?: string
  parentId?: string | null
  type?: ResourceType
  scheduledAt?: Date | null
  scheduledAction?: ScheduledAction | null
} = {}) => {
  const siteId = getSeedSiteId()
  const adminId = await getAdminId()

  const blob = await db
    .insertInto("Blob")
    .values({
      content: jsonb({
        layout: "content",
        page: { contentPageHeader: { summary: "E2E test summary" } },
        content: [],
        version: "0.1.0",
      }),
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  const page = await db
    .insertInto("Resource")
    .values({
      permalink: `e2e-unpublish-${uniqueSuffix()}`,
      siteId,
      parentId,
      title,
      draftBlobId: null,
      state: ResourceState.Published,
      type,
      publishedVersionId: null,
      scheduledAt,
      scheduledBy: scheduledAt ? adminId : null,
      scheduledAction,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  const version = await db
    .insertInto("Version")
    .values({
      versionNum: 1,
      resourceId: page.id,
      blobId: blob.id,
      publishedBy: adminId,
    })
    .returning("id")
    .executeTakeFirstOrThrow()

  await db
    .updateTable("Resource")
    .where("id", "=", page.id)
    .set({ publishedVersionId: version.id })
    .execute()

  return { ...page, publishedVersionId: version.id }
}

// Deletes the resource; cascades to its Version (and any child resources).
export const deleteResourceById = (resourceId: string) =>
  db.deleteFrom("Resource").where("id", "=", resourceId).execute()
