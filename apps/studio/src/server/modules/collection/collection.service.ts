import type {
  CollectionPagePageProps,
  CollectionPageSchemaType,
} from "@opengovsg/isomer-components"
import type { UnwrapTagged } from "type-fest"
import { ISOMER_USABLE_PAGE_LAYOUTS } from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"
import { format } from "date-fns"

import { db, ResourceType } from "../database"

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
}: {
  resourceId?: number
  collectionId?: number
  siteId: number
}): Promise<NonNullable<CollectionPageSchemaType["page"]["tagCategories"]>> => {
  // The schema enforces that exactly one of collectionId / resourceId is set.
  // For collectionId: the IndexPage sits directly under this collection.
  // For resourceId: the IndexPage sits under the resource's parent collection.
  const indexPage = await db
    .selectFrom("Resource")
    .where("type", "=", ResourceType.IndexPage)
    .where("siteId", "=", siteId)
    .$if(collectionId !== undefined, (qb) =>
      qb.where("parentId", "=", String(collectionId)),
    )
    .$if(resourceId !== undefined, (qb) =>
      qb.where("parentId", "=", (eb) =>
        eb
          .selectFrom("Resource")
          .where("id", "=", String(resourceId))
          .where("siteId", "=", siteId)
          .select("parentId"),
      ),
    )
    .select("id")
    .executeTakeFirst()

  if (!indexPage) {
    return []
  }

  const { draftBlobId, publishedVersionId } = await db
    .selectFrom("Resource")
    .where("id", "=", String(indexPage.id))
    .select(["draftBlobId", "publishedVersionId"])
    .executeTakeFirstOrThrow(
      () =>
        new TRPCError({
          code: "NOT_FOUND",
          message: "The specified resource could not be found",
        }),
    )

  if (publishedVersionId) {
    const { content } = await db
      .selectFrom("Blob")
      .where("id", "=", (qb) =>
        qb
          .selectFrom("Version")
          .where("id", "=", publishedVersionId)
          .select("blobId"),
      )
      .selectAll()
      // NOTE: Guaranteed to exist since this is a foreign key
      .executeTakeFirstOrThrow()

    return (
      (content as unknown as CollectionPageSchemaType).page.tagCategories ?? []
    )
  }

  if (draftBlobId) {
    const { content } = await db
      .selectFrom("Blob")
      .where("id", "=", draftBlobId)
      .selectAll()
      // NOTE: Guaranteed to exist since this is a foreign key
      .executeTakeFirstOrThrow()

    return (
      (content as unknown as CollectionPageSchemaType).page.tagCategories ?? []
    )
  }

  return []
}
