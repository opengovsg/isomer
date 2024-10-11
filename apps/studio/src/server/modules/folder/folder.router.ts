import { TRPCError } from "@trpc/server"
import { get } from "lodash"

import {
  createFolderSchema,
  editFolderSchema,
  readFolderSchema,
} from "~/schemas/folder"
import { protectedProcedure, router } from "~/server/trpc"
import { publishSite } from "../aws/codebuild.service"
import { db, ResourceState, ResourceType } from "../database"
import { defaultFolderSelect } from "./folder.select"

export const folderRouter = router({
  create: protectedProcedure
    .input(createFolderSchema)
    .mutation(
      async ({
        ctx,
        input: { folderTitle, parentFolderId, permalink, siteId },
      }) => {
        const folder = await db
          .insertInto("Resource")
          .values({
            permalink,
            siteId,
            type: ResourceType.Folder,
            title: folderTitle,
            parentId: parentFolderId ? String(parentFolderId) : null,
            state: ResourceState.Published,
          })
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

        // TODO: Create the index page for the folder and publish it
        await publishSite(ctx.logger, siteId)

        return { folderId: folder.insertId }
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
    .mutation(
      async ({ ctx, input: { resourceId, permalink, title, siteId } }) => {
        const result = await db
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

        await publishSite(ctx.logger, Number(siteId))

        return result
      },
    ),
})
