import type {
  CollectionPagePageProps,
  CollectionPageSchemaType,
} from "@opengovsg/isomer-components"
import type { MergeExclusive, UnwrapTagged } from "type-fest"
import { ISOMER_USABLE_PAGE_LAYOUTS } from "@opengovsg/isomer-components"
import { format } from "date-fns"

import { db, ResourceType, sql } from "../database"

export const createCollectionPageJson = ({}: {
  type: typeof ResourceType.CollectionPage // Act as soft typeguard
}) => {
  return {
    layout: "article",
    page: {
      date: format(new Date(), "dd/MM/yyyy"),
      // TODO: this is actually supposed to be passed from the frontend
      // which is not done at present
      category: "Feature Articles",
      articlePageHeader: {
        summary: "A concise summary of the main points regarding this article.",
      },
    },
    content: [],
    version: "0.1.0",
  } satisfies UnwrapTagged<PrismaJson.BlobJsonContent>
}

export const createCollectionLinkJson = ({}: {
  type: typeof ResourceType.CollectionLink // Act as soft typeguard
}) => {
  return {
    layout: "link",
    page: {
      ref: "",
      summary: "",
      category: "",
      date: format(new Date(), "dd/MM/yyyy"),
    },
    content: [],
    // TODO: Add pdf blob to content
    version: "0.1.0",
  } satisfies UnwrapTagged<PrismaJson.BlobJsonContent>
}
export const createCollectionIndexJson = (title: string) => {
  return {
    layout: ISOMER_USABLE_PAGE_LAYOUTS.Collection,
    page: {
      title,
      subtitle: `Read up-to-date news articles, speeches, and press releases here.`,
      sortOrder: "date-desc",
    } as CollectionPagePageProps,
    content: [],
    version: "0.1.0",
  }
}

export const getCollectionTagsForResource = async ({
  resourceId,
  collectionId,
  siteId,
  isPublishedOnly = false,
}: { siteId: number; isPublishedOnly?: boolean } & MergeExclusive<
  { resourceId: number },
  { collectionId: number }
>): Promise<NonNullable<CollectionPageSchemaType["page"]["tagCategories"]>> => {
  const row = await db
    .selectFrom("Resource as r")
    .leftJoin("Blob as draftBlob", "r.draftBlobId", "draftBlob.id")
    .leftJoin("Version as v", "r.publishedVersionId", "v.id")
    .leftJoin("Blob as publishedBlob", "v.blobId", "publishedBlob.id")
    .where("r.type", "=", ResourceType.IndexPage)
    .where("r.siteId", "=", siteId)
    .$if(collectionId !== undefined, (qb) =>
      qb.where("r.parentId", "=", String(collectionId)),
    )
    .$if(resourceId !== undefined, (qb) =>
      qb.where("r.parentId", "=", (eb) =>
        eb
          .selectFrom("Resource")
          .where("id", "=", String(resourceId))
          .where("siteId", "=", siteId)
          .select("parentId"),
      ),
    )
    .select([
      sql<CollectionPageSchemaType | null>`"publishedBlob"."content"`.as(
        "publishedContent",
      ),
      sql<CollectionPageSchemaType | null>`"draftBlob"."content"`.as(
        "draftContent",
      ),
    ])
    .executeTakeFirst()

  if (!row) {
    return []
  }

  return isPublishedOnly
    ? (row.publishedContent?.page.tagCategories ?? [])
    : (row.publishedContent?.page.tagCategories ??
        row.draftContent?.page.tagCategories ??
        [])
}
