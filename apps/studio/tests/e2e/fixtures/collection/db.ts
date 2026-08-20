import { db } from "~/server/modules/database"
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { TagCategory } from "./seed"

interface CollectionIndexPage {
  tagCategories?: TagCategory[]
  subtitle?: string
  variant?: string
  sortOrder?: string
  showDate?: boolean
  showThumbnail?: { fallback?: string }
}

export const getRootPageId = async (siteId: number) => {
  const rootPage = await db
    .selectFrom("Resource")
    .where("siteId", "=", siteId)
    .where("type", "=", ResourceType.RootPage)
    .select("id")
    .executeTakeFirstOrThrow()
  return rootPage.id
}

export const getIndexPageId = async (collectionId: string) => {
  const indexPage = await db
    .selectFrom("Resource")
    .where("parentId", "=", collectionId)
    .where("type", "=", ResourceType.IndexPage)
    .select("id")
    .executeTakeFirstOrThrow()
  return indexPage.id
}

export const getDraftIndexPage = async (indexPageId: string) => {
  const row = await db
    .selectFrom("Resource")
    .innerJoin("Blob", "Blob.id", "Resource.draftBlobId")
    .where("Resource.id", "=", indexPageId)
    .select("Blob.content")
    .executeTakeFirst()
  if (!row?.content) return null
  return (row.content as { page: CollectionIndexPage }).page
}

export const getCollectionItemTitles = (collectionId: string) =>
  db
    .selectFrom("Resource")
    .where("parentId", "=", collectionId)
    .where("type", "in", [
      ResourceType.CollectionPage,
      ResourceType.CollectionLink,
    ])
    .select(["id", "title", "type", "state"])
    .orderBy("title", "asc")
    .execute()
