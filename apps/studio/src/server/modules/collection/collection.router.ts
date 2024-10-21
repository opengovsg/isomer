import type { UnwrapTagged } from "type-fest"
import { TRPCError } from "@trpc/server"
import { get } from "lodash"

import {
  createCollectionSchema,
  editLinkSchema,
  readLinkSchema,
} from "~/schemas/collection"
import { readFolderSchema } from "~/schemas/folder"
import { createCollectionPageSchema } from "~/schemas/page"
import { protectedProcedure, router } from "~/server/trpc"
import { db, jsonb, ResourceType } from "../database"
import {
  defaultResourceSelect,
  getSiteResourceById,
} from "../resource/resource.service"
import { defaultCollectionSelect } from "./collection.select"
import {
  createCollectionLinkJson,
  createCollectionPageJson,
} from "./collection.service"

export const collectionRouter = router({
  getMetadata: protectedProcedure
    .input(readFolderSchema)
    .query(async ({ input: { siteId, resourceId } }) => {
      const resource = await getSiteResourceById({
        siteId,
        resourceId: String(resourceId),
        type: "Collection",
      })
      if (!resource) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Collection not found",
        })
      }
      return resource
    }),
  create: protectedProcedure
    .input(createCollectionSchema)
    .mutation(async ({ input: { collectionTitle, permalink, siteId } }) => {
      return db
        .insertInto("Resource")
        .values({
          permalink,
          siteId,
          type: "Collection",
          title: collectionTitle,
        })
        .returning(defaultCollectionSelect)
        .executeTakeFirstOrThrow()
        .catch((err) => {
          if (get(err, "code") === "23505") {
            throw new TRPCError({
              code: "CONFLICT",
              message: "A resource with the same permalink already exists",
            })
          }
          throw err
        })
    }),
  createCollectionPage: protectedProcedure
    .input(createCollectionPageSchema)
    .mutation(async ({ input }) => {
      let newPage: UnwrapTagged<PrismaJson.BlobJsonContent>
      const { title, type, permalink, siteId, collectionId } = input
      if (type === "page") {
        newPage = createCollectionPageJson({ type })
      } else {
        newPage = createCollectionLinkJson({ type })
      }

      // TODO: Validate whether folderId actually is a folder instead of a page
      // TODO: Validate whether siteId is a valid site
      // TODO: Validate user has write-access to the site
      const resource = await db.transaction().execute(async (tx) => {
        const blob = await tx
          .insertInto("Blob")
          .values({
            content: jsonb(newPage),
          })
          .returning("Blob.id")
          .executeTakeFirstOrThrow()

        const addedResource = await tx
          .insertInto("Resource")
          .values({
            title,
            permalink,
            siteId,
            parentId: String(collectionId),
            draftBlobId: blob.id,
            type:
              type === "page"
                ? ResourceType.CollectionPage
                : ResourceType.CollectionLink,
          })
          .returning("Resource.id")
          .executeTakeFirstOrThrow()
          .catch((err) => {
            if (get(err, "code") === "23505") {
              throw new TRPCError({
                code: "CONFLICT",
                message: "A resource with the same permalink already exists",
              })
            }
            throw err
          })
        return addedResource
      })
      return { pageId: resource.id }
    }),
  // TODO: change this schema
  getSiblingsOf: protectedProcedure
    .input(readFolderSchema)
    .query(async ({ ctx, input: { resourceId, siteId, limit, offset } }) => {
      // Things that aren't working yet:
      // 0. Perm checking
      // 1. Last Edited user and time
      // 2. Page status(draft, published)
      return await ctx.db.transaction().execute(async (tx) => {
        const resource = await tx
          .selectFrom("Resource")
          .where("Resource.id", "=", String(resourceId))
          .where((eb) => {
            return eb.or([
              eb("Resource.type", "=", ResourceType.CollectionPage),
              eb("Resource.type", "=", ResourceType.CollectionLink),
            ])
          })
          .select("Resource.parentId")
          .executeTakeFirst()

        if (!resource) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Please ensure that you have requested for a collection",
          })
        }

        return tx
          .selectFrom("Resource")
          .where("Resource.parentId", "=", resource.parentId)
          .where("Resource.siteId", "=", siteId)
          .where((eb) => {
            return eb.or([
              eb("Resource.type", "=", ResourceType.CollectionPage),
              eb("Resource.type", "=", ResourceType.CollectionLink),
            ])
          })
          .orderBy("Resource.type", "asc")
          .orderBy("Resource.title", "asc")
          .limit(limit)
          .offset(offset)
          .select(defaultResourceSelect)
          .execute()
      })
    }),
  list: protectedProcedure
    .input(readFolderSchema)
    .query(async ({ ctx, input: { resourceId, siteId, limit, offset } }) => {
      // Things that aren't working yet:
      // 0. Perm checking
      // 1. Last Edited user and time
      // 2. Page status(draft, published)

      return await ctx.db
        .selectFrom("Resource")
        .where("parentId", "=", String(resourceId))
        .where("Resource.siteId", "=", siteId)
        .where((eb) => {
          return eb.or([
            eb("Resource.type", "=", ResourceType.CollectionPage),
            eb("Resource.type", "=", ResourceType.CollectionLink),
          ])
        })
        .orderBy("Resource.type", "asc")
        .orderBy("Resource.title", "asc")
        .limit(limit)
        .offset(offset)
        .select(defaultResourceSelect)
        .execute()
    }),
  readCollectionLink: protectedProcedure
    .input(readLinkSchema)
    .query(async ({ input: { linkId, siteId } }) => {
      return await db
        .selectFrom("Resource")
        .where("Resource.id", "=", String(linkId))
        .where("Resource.siteId", "=", siteId)
        .innerJoin("Blob", "Resource.draftBlobId", "Blob.id")
        .select(["Blob.content", "Resource.title"])
        .executeTakeFirstOrThrow()
    }),

  updateCollectionLink: protectedProcedure
    .input(editLinkSchema)
    .mutation(
      async ({
        input: { date, category, linkId, siteId, description, ref },
      }) => {
        // Things that aren't working yet:
        // 0. Perm checking
        // 1. Last Edited user and time
        // 2. Page status(draft, published)
        return await db.transaction().execute(async (tx) => {
          const { draftBlobId } = await tx
            .selectFrom("Resource")
            .where("Resource.id", "=", String(linkId))
            .where("Resource.siteId", "=", siteId)
            .select("Resource.draftBlobId")
            .executeTakeFirstOrThrow()

          const { content } = await tx
            .selectFrom("Blob")
            .where("Blob.id", "=", draftBlobId)
            .select("Blob.content")
            .executeTakeFirstOrThrow()

          await tx
            .updateTable("Blob")
            .set({
              content: {
                ...content,
                page: { description, ref, date, category },
              },
            })
            .execute()
        })
      },
    ),
})
