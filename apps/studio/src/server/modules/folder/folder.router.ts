import { TRPCError } from "@trpc/server"
import { get } from "lodash"
import pick from "lodash/pick"

import { INDEX_PAGE_PERMALINK } from "~/constants/sitemap"
import {
  createFolderSchema,
  editFolderSchema,
  getIndexpageSchema,
  readFolderSchema,
} from "~/schemas/folder"
import { protectedProcedure, router } from "~/server/trpc"
import { logResourceEvent } from "../audit/audit.service"
import {
  AuditLogEvent,
  db,
  jsonb,
  ResourceState,
  ResourceType,
} from "../database"
import { PG_ERROR_CODES } from "../database/constants"
import { createFolderIndexPage } from "../page/page.service"
import { bulkValidateUserPermissionsForResources } from "../permissions/permissions.service"
import { publishResource } from "../resource/resource.service"
import { defaultFolderSelect } from "./folder.select"

export const folderRouter = router({
  create: protectedProcedure
    .input(createFolderSchema)
    .mutation(
      async ({
        ctx,
        input: { siteId, folderTitle, parentFolderId, permalink },
      }) => {
        await bulkValidateUserPermissionsForResources({
          siteId,
          action: "create",
          userId: ctx.user.id,
          resourceIds: [!!parentFolderId ? String(parentFolderId) : null],
        })

        // Get user information
        const user = await db
          .selectFrom("User")
          .where("id", "=", ctx.user.id)
          .selectAll()
          .executeTakeFirstOrThrow(() => new TRPCError({ code: "NOT_FOUND" }))

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
          if (parentFolder.type !== "Folder") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Resource ID does not point to a folder",
            })
          }
        }

        const folder = await db.transaction().execute(async (tx) => {
          const folder = await tx
            .insertInto("Resource")
            .values({
              permalink,
              siteId,
              type: ResourceType.Folder,
              title: folderTitle,
              parentId: parentFolderId ? String(parentFolderId) : null,
              state: ResourceState.Published,
            })
            .returningAll()
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

          const indexPageBlob = await tx
            .insertInto("Blob")
            .values({
              content: jsonb(createFolderIndexPage(folderTitle)),
            })
            .returning("id")
            .executeTakeFirstOrThrow()

          const indexPage = await tx
            .insertInto("Resource")
            .values({
              parentId: folder.id,
              draftBlobId: indexPageBlob.id,
              title: folderTitle,
              type: ResourceType.IndexPage,
              permalink: INDEX_PAGE_PERMALINK,
              siteId,
            })
            .returningAll()
            .executeTakeFirstOrThrow()

          await logResourceEvent(tx, {
            siteId,
            eventType: AuditLogEvent.ResourceCreate,
            delta: {
              before: null,
              after: folder,
            },
            by: user,
          })

          await logResourceEvent(tx, {
            siteId,
            eventType: AuditLogEvent.ResourceCreate,
            delta: {
              before: null,
              after: indexPage,
            },
            by: user,
          })

          return { ...folder, indexPage }
        })

        // NOTE: We cannot publish inside the tx above because
        // this also calls into a tx,
        // so it cannot see that the resources are inserted
        await publishResource(ctx.user.id, folder, ctx.logger)

        return { folderId: folder.id }
      },
    ),
  getMetadata: protectedProcedure
    .input(readFolderSchema)
    .query(async ({ ctx, input }) => {
      await bulkValidateUserPermissionsForResources({
        siteId: input.siteId,
        action: "read",
        userId: ctx.user.id,
      })
      // Things that aren't working yet:
      // 1. Last Edited user and time
      // 2. Page status(draft, published)

      const data = await db
        .selectFrom("Resource")
        .select(["Resource.title", "Resource.permalink", "Resource.parentId"])
        .where("id", "=", String(input.resourceId))
        .executeTakeFirst()

      if (!data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This folder does not exist",
        })
      }

      return data
    }),
  editFolder: protectedProcedure
    .input(editFolderSchema)
    .mutation(
      async ({ ctx, input: { resourceId, permalink, title, siteId } }) => {
        await bulkValidateUserPermissionsForResources({
          siteId: Number(siteId),
          action: "update",
          userId: ctx.user.id,
        })

        const user = await db
          .selectFrom("User")
          .where("id", "=", ctx.user.id)
          .selectAll()
          .executeTakeFirstOrThrow(() => new TRPCError({ code: "NOT_FOUND" }))

        const result = await db.transaction().execute(async (tx) => {
          const oldResource = await tx
            .selectFrom("Resource")
            .selectAll()
            .where("Resource.id", "=", resourceId)
            .where("Resource.siteId", "=", Number(siteId))
            .where("Resource.type", "in", [
              ResourceType.Folder,
              ResourceType.Collection,
            ])
            .executeTakeFirst()

          if (!oldResource) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Resource does not exist",
            })
          }

          const newResource = await tx
            .updateTable("Resource")
            .where("Resource.id", "=", oldResource.id)
            .where("Resource.siteId", "=", oldResource.siteId)
            .where("Resource.type", "in", [
              ResourceType.Folder,
              ResourceType.Collection,
            ])
            .set({
              permalink,
              title,
            })
            .returningAll()
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

          // NOTE: update the index page's title so that they stay in sync
          await tx
            .updateTable("Resource")
            .where("Resource.parentId", "=", oldResource.id)
            .where("Resource.siteId", "=", oldResource.siteId)
            .where("Resource.type", "=", ResourceType.IndexPage)
            .set({
              title,
            })
            // NOTE: we cannot throw here because
            // it's entirely possible that the index page doesn't exist
            .executeTakeFirst()

          await logResourceEvent(tx, {
            siteId: Number(siteId),
            eventType: AuditLogEvent.ResourceUpdate,
            delta: {
              before: oldResource,
              after: newResource,
            },
            by: user,
          })

          return newResource
        })

        await publishResource(user.id, result, ctx.logger)

        return pick(result, defaultFolderSelect)
      },
    ),

  getIndexpage: protectedProcedure
    .input(getIndexpageSchema)
    .query(async ({ ctx, input: { resourceId, siteId } }) => {
      await bulkValidateUserPermissionsForResources({
        siteId,
        action: "read",
        userId: ctx.user.id,
        resourceIds: [resourceId],
      })

      const { title } = await db
        .selectFrom("Resource")
        .where("id", "=", resourceId)
        .select("title")
        .executeTakeFirstOrThrow()

      const indexPage = await db
        .selectFrom("Resource")
        .where("Resource.parentId", "=", resourceId)
        .where("Resource.type", "=", ResourceType.IndexPage)
        .select(["id", "draftBlobId"])
        .executeTakeFirstOrThrow(
          () =>
            new TRPCError({
              code: "NOT_FOUND",
              message: "No existing index page found",
            }),
        )

      return { title, ...indexPage }
    }),
})
