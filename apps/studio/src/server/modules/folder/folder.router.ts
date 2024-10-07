import { TRPCError } from "@trpc/server"
import { get } from "lodash"

import {
  createFolderSchema,
  editFolderSchema,
  readFolderSchema,
} from "~/schemas/folder"
import { protectedProcedure, router } from "~/server/trpc"
import { db } from "../database"
import { defaultFolderSelect } from "./folder.select"

export const folderRouter = router({
  create: protectedProcedure
    .input(createFolderSchema)
    .mutation(
      async ({ input: { folderTitle, parentFolderId, siteId, permalink } }) => {
        const folder = await db.transaction().execute(async (tx) => {
          // TODO: Validate user has permissions to site.
          // Validate site is valid
          const site = await tx
            .selectFrom("Site")
            .where("id", "=", siteId)
            .select(["id"])
            .executeTakeFirst()

          if (!site) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Site does not exist",
            })
          }

          // Validate parentFolderId is a folder
          if (parentFolderId) {
            const parentFolder = await tx
              .selectFrom("Resource")
              .where("Resource.id", "=", String(parentFolderId))
              .where("Resource.siteId", "=", siteId)
              .select(["Resource.type", "Resource.id"])
              .executeTakeFirst()

            if (!parentFolder) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Parent folder does not exist",
              })
            }
            if (parentFolder.type !== "Folder") {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Resource ID does not point to a folder",
              })
            }
          }

          return tx
            .insertInto("Resource")
            .values({
              siteId,
              permalink,
              type: "Folder",
              title: folderTitle,
              parentId: parentFolderId ? String(parentFolderId) : null,
            })
            .returning("id")
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
        })
        return { folderId: folder.id }
      },
    ),
  getMetadata: protectedProcedure
    .input(readFolderSchema)
    .query(async ({ ctx, input }) => {
      // Things that aren't working yet:
      // 0. Perm checking
      // 1. Last Edited user and time
      // 2. Page status(draft, published)

      return await ctx.db
        .selectFrom("Resource")
        .select(["Resource.title", "Resource.permalink", "Resource.parentId"])
        .where("id", "=", String(input.resourceId))
        .executeTakeFirstOrThrow()
    }),
  editFolder: protectedProcedure
    .input(editFolderSchema)
    .mutation(async ({ input: { resourceId, permalink, title, siteId } }) => {
      return db
        .updateTable("Resource")
        .where("Resource.id", "=", resourceId)
        .where("Resource.siteId", "=", Number(siteId))
        .where("Resource.type", "in", ["Folder", "Collection"])
        .set({
          permalink,
          title,
        })
        .returning(defaultFolderSelect)
        .execute()
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
})
