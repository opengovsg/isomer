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
import { validateUserPermissions } from "../permissions/permissions.service"
import { defaultFolderSelect } from "./folder.select"

export const folderRouter = router({
  create: protectedProcedure
    .input(createFolderSchema)
    .mutation(
      async ({
        ctx,
        input: { siteId, folderTitle, parentFolderId, ...rest },
      }) => {
        await validateUserPermissions({
          siteId,
          action: "create",
          userId: ctx.user.id,
          resourceId: !!parentFolderId ? String(parentFolderId) : null,
        })

        const folder = await db
          .insertInto("Resource")
          .values({
            ...rest,
            siteId,
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
      },
    ),
  getMetadata: protectedProcedure
    .input(readFolderSchema)
    .query(async ({ ctx, input }) => {
      await validateUserPermissions({
        siteId: input.siteId,
        action: "read",
        userId: ctx.user.id,
      })
      // Things that aren't working yet:
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
        await validateUserPermissions({
          siteId: Number(siteId),
          action: "create",
          userId: ctx.user.id,
        })

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
      },
    ),
})
