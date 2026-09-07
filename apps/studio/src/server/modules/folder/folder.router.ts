import { TRPCError } from "@trpc/server"
import { get, pick } from "lodash-es"
import { INDEX_PAGE_PERMALINK } from "~/constants/sitemap"
import {
  createFolderSchema,
  editFolderSchema,
  getIndexpageSchema,
  listChildPagesSchema,
  readFolderSchema,
} from "~/schemas/folder"
import { protectedProcedure, router } from "~/server/trpc"

import { logResourceEvent } from "../audit/audit.service"
import { PG_ERROR_CODES } from "../database/constants"
import { db } from "../database/database"
import { AuditLogEvent, ResourceState, ResourceType } from "../database/types"
import { jsonb } from "../database/utils"
import { createFolderIndexPage } from "../page/page.service"
import { bulkValidateUserPermissionsForResources } from "../permissions/permissions.service"
import { applyFolderPermalinkChangeRedirects } from "../redirect/redirect.service"
import {
  getResourceFullPermalink,
  hasPublishedDescendant,
  publishResource,
} from "../resource/resource.service"
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
          action: "create",
          resourceIds: [parentFolderId ? String(parentFolderId) : null],
          siteId,
          userId: ctx.user.id,
        })

        const [user, site] = await Promise.all([
          db
            .selectFrom("User")
            .where("id", "=", ctx.user.id)
            .selectAll()
            .executeTakeFirstOrThrow(
              () => new TRPCError({ code: "NOT_FOUND" }),
            ),
          db
            .selectFrom("Site")
            .where("id", "=", siteId)
            .select(["id"])
            .executeTakeFirst(),
        ])

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
          const [folder, indexPageBlob] = await Promise.all([
            tx
              .insertInto("Resource")
              .values({
                parentId: parentFolderId ? String(parentFolderId) : null,
                permalink,
                siteId,
                state: ResourceState.Published,
                title: folderTitle,
                type: ResourceType.Folder,
              })
              .returningAll()
              .executeTakeFirstOrThrow()
              .catch((error: unknown) => {
                if (get(error, "code") === PG_ERROR_CODES.uniqueViolation) {
                  throw new TRPCError({
                    code: "CONFLICT",
                    message:
                      "A resource with the same permalink already exists",
                  })
                }
                throw error
              }),
            tx
              .insertInto("Blob")
              .values({
                content: jsonb(createFolderIndexPage(folderTitle)),
              })
              .returning("id")
              .executeTakeFirstOrThrow(),
          ])

          const indexPage = await tx
            .insertInto("Resource")
            .values({
              draftBlobId: indexPageBlob.id,
              parentId: folder.id,
              permalink: INDEX_PAGE_PERMALINK,
              siteId,
              title: folderTitle,
              type: ResourceType.IndexPage,
            })
            .returningAll()
            .executeTakeFirstOrThrow()
            .catch((error: unknown) => {
              if (get(error, "code") === PG_ERROR_CODES.uniqueViolation) {
                throw new TRPCError({
                  code: "CONFLICT",
                  message: "A resource with the same permalink already exists",
                })
              }
              throw error
            })

          await logResourceEvent(tx, {
            by: user,
            delta: {
              after: folder,
              before: null,
            },
            eventType: AuditLogEvent.ResourceCreate,
            siteId,
          })

          await logResourceEvent(tx, {
            by: user,
            delta: {
              after: indexPage,
              before: null,
            },
            eventType: AuditLogEvent.ResourceCreate,
            siteId,
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
  editFolder: protectedProcedure
    .input(editFolderSchema)
    .mutation(
      async ({
        ctx,
        input: { resourceId, permalink, title, siteId, shouldCreateRedirect },
      }) => {
        await bulkValidateUserPermissionsForResources({
          action: "update",
          siteId,
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
            .where("Resource.siteId", "=", siteId)
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

          // Capture the folder's CURRENT full permalink BEFORE the update below
          // rewrites Resource.permalink — getResourceFullPermalink walks the live
          // tree, so reading it afterwards would return the NEW path and the
          // redirect would be a no-op. Needed on any actual permalink change so
          // the descendant shadow guard below always runs — the flag only gates
          // whether a redirect gets CREATED, not whether the move is validated
          // against redirects that already exist.
          const permalinkChanged =
            !!permalink && permalink !== oldResource.permalink
          const oldFullPermalink = permalinkChanged
            ? await getResourceFullPermalink(siteId, Number(resourceId), tx)
            : null

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
            .catch((error: unknown) => {
              if (get(error, "code") === PG_ERROR_CODES.uniqueViolation) {
                throw new TRPCError({
                  code: "CONFLICT",
                  message: "A resource with the same permalink already exists",
                })
              }
              throw error
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
            by: user,
            delta: {
              after: newResource,
              before: oldResource,
            },
            eventType: AuditLogEvent.ResourceUpdate,
            siteId,
          })

          // A renamed folder/collection changes every descendant's URL — preserve
          // them with one wildcard redirect ("/old-folder/*"). oldFullPermalink
          // was captured pre-update; only the last path segment changed, so swap
          // it to derive the new full permalink without re-walking the tree.
          if (permalinkChanged && oldFullPermalink !== null) {
            const newFullPermalink =
              oldFullPermalink.slice(0, oldFullPermalink.lastIndexOf("/") + 1) +
              newResource.permalink
            await applyFolderPermalinkChangeRedirects(tx, {
              byUserId: user.id,
              hasLiveContent: await hasPublishedDescendant(tx, {
                resourceId,
                siteId,
              }),
              newFullPermalink,
              oldFullPermalink,
              resourceId,
              shouldCreateRedirect,
              siteId,
            })
          }

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
        action: "read",
        resourceIds: [resourceId],
        siteId,
        userId: ctx.user.id,
      })

      const [{ title }, indexPage] = await Promise.all([
        db
          .selectFrom("Resource")
          .where("Resource.siteId", "=", siteId)
          .where("Resource.id", "=", resourceId)
          .select("title")
          .executeTakeFirstOrThrow(),
        db
          .selectFrom("Resource")
          .where("Resource.siteId", "=", siteId)
          .where("Resource.parentId", "=", resourceId)
          .where("Resource.type", "=", ResourceType.IndexPage)
          .select(["id", "draftBlobId"])
          .executeTakeFirstOrThrow(
            () =>
              new TRPCError({
                code: "NOT_FOUND",
                message: "No existing index page found",
              }),
          ),
      ])

      return { title, ...indexPage }
    }),
  getMetadata: protectedProcedure
    .input(readFolderSchema)
    .query(async ({ ctx, input: { siteId, resourceId } }) => {
      await bulkValidateUserPermissionsForResources({
        action: "read",
        siteId,
        userId: ctx.user.id,
      })
      // Things that aren't working yet:
      // 1. Last Edited user and time
      // 2. Page status(draft, published)

      const data = await db
        .selectFrom("Resource")
        .select(["Resource.title", "Resource.permalink", "Resource.parentId"])
        .where("siteId", "=", siteId)
        .where("id", "=", String(resourceId))
        .executeTakeFirst()

      if (!data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This folder does not exist",
        })
      }

      return data
    }),
  listChildPages: protectedProcedure
    .input(listChildPagesSchema)
    .query(async ({ ctx, input: { indexPageId, siteId } }) => {
      await bulkValidateUserPermissionsForResources({
        action: "read",
        resourceIds: [indexPageId],
        siteId,
        userId: ctx.user.id,
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
      // NOTE: The `resourceId` passed here is the id of the index page
      // of the folder, not the actual folder itself
      const { parentId, type } = await db
        .selectFrom("Resource")
        .where("siteId", "=", siteId)
        .where("id", "=", indexPageId)
        .select(["parentId", "type"])
        // NOTE: Technically we'll already throw
        // inside the permissions check,
        // but just putting it here again for future proofing
        .executeTakeFirstOrThrow(
          () =>
            new TRPCError({
              code: "NOT_FOUND",
              message: "No index page with the specified id could be found",
            }),
        )

      if (type !== ResourceType.IndexPage) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No index page with the specified id could be found",
        })
      }

      // NOTE: This is not a general `resource.list`
      // but reimplemented here because it makes certain assumptions about what should be shown
      const childPages = await db
        .with("directChildren", (eb) =>
          eb
            .selectFrom("Resource")
            .where("parentId", "=", parentId)
            .where("siteId", "=", siteId)
            .where("state", "=", ResourceState.Published)
            .where("type", "in", [
              ResourceType.Folder,
              ResourceType.Collection,
              ResourceType.Page,
            ])
            .select(["Resource.id", "title", "type", "permalink"]),
        )
        // NOTE: we need to select the `Folder/Collection`.`id`
        // rather than the `IndexPage` as our publishing script
        // uses the actual `id` of the containing `Folder/Collection`.
        // However, we will use the `IndexPage` as a filter as we should only
        // show the preview for published `IndexPages` (draft pages won't show on end site)
        .with("publishedCousinIndexPages", (eb) =>
          eb
            .selectFrom("Resource")
            .where("parentId", "in", (qb) =>
              qb
                .selectFrom("directChildren")
                .where("type", "in", [
                  ResourceType.Folder,
                  ResourceType.Collection,
                ])
                .select("id"),
            )
            // NOTE: Keeping in line with how we select resources for sitemap,
            // we will only select published index pages here
            .where("state", "=", ResourceState.Published)
            .where("type", "=", ResourceType.IndexPage)
            .select([
              "Resource.parentId",
              (eb) =>
                eb
                  .selectFrom("Resource as Parent")
                  .whereRef("Parent.id", "=", "Resource.parentId")
                  .select("Parent.type")
                  .as("parentType"),
            ]),
        )
        .selectFrom("Resource")
        .where("siteId", "=", siteId)
        .where("id", "in", (qb) =>
          qb
            .selectFrom("publishedCousinIndexPages")
            .where("parentType", "in", [
              ResourceType.Collection,
              ResourceType.Folder,
            ])
            .select("parentId"),
        )
        .select(["id", "title", "type", "permalink"])
        .unionAll((qb) =>
          qb
            .selectFrom("directChildren")
            .where("type", "=", ResourceType.Page)
            .select(["id", "title", "type", "permalink"]),
        )
        .execute()

      // Deferred: Think about how to handle cases where 2 people are editing the order
      return { childPages }
    }),
})
