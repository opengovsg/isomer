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
import { PG_ERROR_CODES } from "../database/constants"
import { validateUserPermissionsForResource } from "../permissions/permissions.service"
import { defaultFolderSelect } from "./folder.select"

export const folderRouter = router({
  create: protectedProcedure
    .input(createFolderSchema)
    .mutation(
      async ({
        ctx,
        input: { siteId, folderTitle, parentFolderId, permalink },
      }) => {
        await validateUserPermissionsForResource({
          siteId,
          action: "create",
          userId: ctx.user.id,
          resourceId: !!parentFolderId ? String(parentFolderId) : null,
        })

        // Validate site is valid
        const site = await db
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
          const parentFolder = await db
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
          if (
            parentFolder.type !== "Folder" &&
            parentFolder.type !== "RootPage"
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Resource ID does not point to a folder",
            })
          }
        }

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
            if (get(err, "code") === PG_ERROR_CODES.uniqueViolation) {
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
      await validateUserPermissionsForResource({
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
        await validateUserPermissionsForResource({
          siteId: Number(siteId),
          action: "update",
          userId: ctx.user.id,
        })

        const result = await db
          .updateTable("Resource")
          .where("Resource.id", "=", resourceId)
          .where("Resource.siteId", "=", Number(siteId))
          .where("Resource.type", "in", [
            ResourceType.Folder,
            ResourceType.Collection,
          ])
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

        await publishSite(ctx.logger, Number(siteId))

        return result
      },
    ),
})
