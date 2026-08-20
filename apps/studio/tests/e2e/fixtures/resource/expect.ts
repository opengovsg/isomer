import { expect } from "@playwright/test"
import { db } from "~/server/modules/database"

import { getResourceDraftBlobContent } from "./db"

export const expectResourceAbsent = (resourceId: string) =>
  expect.poll(async () => {
    const row = await db
      .selectFrom("Resource")
      .where("id", "=", resourceId)
      .select("id")
      .executeTakeFirst()
    return row?.id ?? null
  })

export const expectResourcePresent = (resourceId: string) =>
  expect.poll(async () => {
    const row = await db
      .selectFrom("Resource")
      .where("id", "=", resourceId)
      .select("id")
      .executeTakeFirst()
    return row?.id ?? null
  })

export const expectResourceParentId = (resourceId: string) =>
  expect.poll(async () => {
    const row = await db
      .selectFrom("Resource")
      .where("id", "=", resourceId)
      .select("parentId")
      .executeTakeFirst()
    return row?.parentId ?? null
  })

export const expectResourceTitle = (resourceId: string) =>
  expect.poll(async () => {
    const row = await db
      .selectFrom("Resource")
      .where("id", "=", resourceId)
      .select("title")
      .executeTakeFirst()
    return row?.title ?? null
  })

export const expectResourceState = (resourceId: string) =>
  expect.poll(async () => {
    const row = await db
      .selectFrom("Resource")
      .where("id", "=", resourceId)
      .select("state")
      .executeTakeFirst()
    return row?.state ?? null
  })

export const expectResourceDraftBlobId = (resourceId: string) =>
  expect.poll(async () => {
    const row = await db
      .selectFrom("Resource")
      .where("id", "=", resourceId)
      .select("draftBlobId")
      .executeTakeFirst()
    return row?.draftBlobId ?? null
  })

export const expectResourceDraftBlobContains = (
  resourceId: string,
  text: string,
) => expect.poll(() => getResourceDraftBlobContent(resourceId)).toContain(text)

export const expectResourcePermalink = (resourceId: string) =>
  expect.poll(async () => {
    const row = await db
      .selectFrom("Resource")
      .where("id", "=", resourceId)
      .select("permalink")
      .executeTakeFirst()
    return row?.permalink ?? null
  })

export const expectResourceScheduledAt = (resourceId: string) =>
  expect.poll(async () => {
    const row = await db
      .selectFrom("Resource")
      .where("id", "=", resourceId)
      .select("scheduledAt")
      .executeTakeFirst()
    return row?.scheduledAt ?? null
  })

export const expectResourceScheduledBy = (resourceId: string) =>
  expect.poll(async () => {
    const row = await db
      .selectFrom("Resource")
      .where("id", "=", resourceId)
      .select("scheduledBy")
      .executeTakeFirst()
    return row?.scheduledBy ?? null
  })
