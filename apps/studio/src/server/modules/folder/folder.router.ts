import { TRPCError } from "@trpc/server"
import { get } from "lodash"

import {
  createFolderSchema,
  editFolderSchema,
  readFolderSchema,
} from "~/schemas/folder"
import { protectedProcedure, router } from "~/server/trpc"
import { db } from "../database"
import { PG_ERROR_CODES } from "../database/constants"
import { defaultFolderSelect } from "./folder.select"

export const folderRouter = router({
  create: protectedProcedure
    .input(createFolderSchema)
    .mutation(async ({ input: { folderTitle, parentFolderId, ...rest } }) => {
      const folder = await db
        .insertInto("Resource")
        .values({
          ...rest,
          type: "Folder",
          title: folderTitle,
          parentId: parentFolderId ? String(parentFolderId) : null,
        })
        .executeTakeFirstOrThrow()
        .catch((err) => {
          if (get(err, "code") === PG_ERROR_CODES.uniqueViolation) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "A resource with the same permalink already exists",
            })
          }
          throw err
        })
      return { folderId: folder.insertId }
    }),
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
          if (get(err, "code") === PG_ERROR_CODES.uniqueViolation) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "A resource with the same permalink already exists",
            })
          }
          throw err
        })
    }),
})
