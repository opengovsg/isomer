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
    }),
})
