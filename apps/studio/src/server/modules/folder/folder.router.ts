import { createFolderSchema, readFolderSchema } from "~/schemas/folder"
import { protectedProcedure, router } from "~/server/trpc"
import { db } from "../database"

export const folderRouter = router({
  create: protectedProcedure
    .input(createFolderSchema)
    .mutation(
      async ({ ctx, input: { folderTitle, parentFolderId, ...rest } }) => {
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
      },
    ),
  readFolder: protectedProcedure
    .input(readFolderSchema)
    .query(async ({ ctx, input }) => {
      // Things that aren't working yet:
      // 0. Perm checking
      // 1. Last Edited user and time
      // 2. Page status(draft, published)

      const folderResult = await ctx.db
        .selectFrom("Resource")
        .selectAll("Resource")
        .where("id", "=", String(input.resourceId))
        .executeTakeFirstOrThrow()
      const childrenResult = await ctx.db
        .selectFrom("Resource")
        .selectAll("Resource")
        .where("parentId", "=", String(input.resourceId))
        .execute()
      const children = childrenResult.map((c) => {
        if (c.draftBlobId || c.publishedVersionId) {
          return {
            id: c.id,
            permalink: c.permalink,
            type: "page",
            lastEditDate: new Date(0),
            lastEditUser: "Coming Soon",
            status: "published",
          }
        }
        return {
          id: c.id,
          permalink: c.permalink,
          type: "folder",
        }
      })

      const { parentId } = folderResult
      const folderName = folderResult.permalink

      return {
        folderName,
        children,
        parentId,
      }
    }),
})
