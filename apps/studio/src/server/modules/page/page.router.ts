import type { IsomerSchema } from "@opengovsg/isomer-components"
import { getLayoutMetadataSchema, schema } from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"
import Ajv from "ajv"
import { get, isEmpty, isEqual } from "lodash"
import { z } from "zod"

import type {
  CrudResourceActions,
  PermissionsProps,
} from "../permissions/permissions.type"
import {
  basePageSchema,
  createPageSchema,
  getRootPageSchema,
  pageSettingsSchema,
  publishPageSchema,
  reorderBlobSchema,
  updatePageBlobSchema,
  updatePageSchema,
} from "~/schemas/page"
import { protectedProcedure, router } from "~/server/trpc"
import { safeJsonParse } from "~/utils/safeJsonParse"
import { startProjectById, stopRunningBuilds } from "../aws/codebuild.service"
import { db, ResourceType } from "../database"
import { PG_ERROR_CODES } from "../database/constants"
import { definePermissionsFor } from "../permissions/permissions.service"
import {
  getFooter,
  getFullPageById,
  getNavBar,
  getPageById,
  getResourceFullPermalink,
  getResourcePermalinkTree,
  updateBlobById,
  updatePageById,
} from "../resource/resource.service"
import { getSiteConfig, getSiteNameAndCodeBuildId } from "../site/site.service"
import { incrementVersion } from "../version/version.service"
import { createDefaultPage } from "./page.service"

const ajv = new Ajv({ allErrors: true, strict: false, logger: false })
const schemaValidator = ajv.compile<IsomerSchema>(schema)

const validateUserPermissions = async ({
  action,
  resourceId = null,
  ...rest
}: PermissionsProps & { action: CrudResourceActions }) => {
  // TODO: this is using site wide permissions for now
  // we should fetch the oldest `parent` of this resource eventually
  const hasCustomParentId = resourceId === null || action === "create"
  const resource = hasCustomParentId
    ? // NOTE: If this is at root, we will always use `null` as the parent
      // otherwise, this is a `create` action and the parent of the resource that
      // we want to create is the resource passed in.
      // However, because we don't have root level permissions for now,
      // we will pass in `null` to signify the site level permissions
      { parentId: null }
    : await db
        .selectFrom("Resource")
        .where("Resource.id", "=", resourceId)
        .select(["Resource.parentId"])
        .executeTakeFirstOrThrow()

  const perms = await definePermissionsFor({ ...rest, resourceId: null })

  // TODO: create should check against the current resource id
  if (perms.cannot(action, resource)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have sufficient permissions to perform this action",
    })
  }
}

// TODO: Need to do validation like checking for existence of the page
// and whether the user has write-access to said page: replace protectorProcedure in this with the new procedure
const validatedPageProcedure = protectedProcedure.use(
  async ({ next, rawInput }) => {
    if (
      typeof rawInput === "object" &&
      rawInput !== null &&
      "content" in rawInput
    ) {
      // NOTE: content will be the entire page schema for now...
      if (!schemaValidator(safeJsonParse(rawInput.content as string))) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Schema validation failed.",
          cause: schemaValidator.errors,
        })
      }
    } else {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Missing request parameters.",
      })
    }

    return next()
  },
)

export const pageRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        siteId: z.number(),
        resourceId: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input: { siteId, resourceId } }) => {
      await validateUserPermissions({
        userId: ctx.user.id,
        siteId,
        action: "read",
      })

      let query = db
        .selectFrom("Resource")
        .where("Resource.siteId", "=", siteId)

      if (resourceId) {
        query = query.where("Resource.parentId", "=", String(resourceId))
      }
      return query
        .select([
          "Resource.id",
          "Resource.permalink",
          "Resource.title",
          "Resource.publishedVersionId",
          "Resource.draftBlobId",
          "Resource.type",
        ])
        .execute()
    }),

  readPage: protectedProcedure
    .input(basePageSchema)
    .query(async ({ ctx, input: { pageId, siteId } }) => {
      await validateUserPermissions({
        userId: ctx.user.id,
        siteId,
        action: "read",
      })
      return getPageById(db, { resourceId: pageId, siteId })
    }),

  readPageAndBlob: protectedProcedure
    .input(basePageSchema)
    .query(async ({ ctx, input: { pageId, siteId } }) => {
      await validateUserPermissions({
        userId: ctx.user.id,
        siteId,
        action: "read",
      })
      // TODO: Return blob last modified so the renderer can show last modified
      return db.transaction().execute(async (tx) => {
        const page = await getFullPageById(tx, { resourceId: pageId, siteId })
        if (!page) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Resource not found",
          })
        }

        const siteMeta = await getSiteConfig(page.siteId)
        const navbar = await getNavBar(page.siteId)
        const footer = await getFooter(page.siteId)

        const { title, type, permalink, content, updatedAt } = page

        return {
          permalink,
          navbar,
          footer,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore type instantiation is excessively deep and possibly infinite
          content,
          title,
          type,
          updatedAt,
          ...siteMeta,
        }
      })
    }),

  reorderBlock: protectedProcedure
    .input(reorderBlobSchema)
    .mutation(async ({ ctx, input: { pageId, from, to, blocks, siteId } }) => {
      await validateUserPermissions({
        userId: ctx.user.id,
        siteId,
        action: "update",
      })

      // NOTE: we have to check against the page's content that we retrieve from db
      // we adopt a strict check such that we allow the update iff the checksum is the same
      return db.transaction().execute(async (tx) => {
        const fullPage = await getFullPageById(tx, {
          resourceId: pageId,
          siteId,
        })
        if (!fullPage?.content) {
          // TODO: we should probably ping on call
          throw new TRPCError({
            code: "NOT_FOUND",
            message:
              "Unable to load content for the requested page, please contact Isomer Support",
          })
        }

        const actualBlocks = fullPage.content.content

        if (!isEqual(blocks, actualBlocks)) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "Someone on your team has changed this page, refresh the page and try again",
          })
        }

        if (
          from >= actualBlocks.length ||
          to >= actualBlocks.length ||
          from < 0 ||
          to < 0
        ) {
          // NOTE: If this happens, this indicates that either our dnd libary on our frontend has a
          // bug or someone is trying to mess with our frontend
          throw new TRPCError({ code: "UNPROCESSABLE_CONTENT" })
        }

        const [movedBlock] = actualBlocks.splice(from, 1)
        if (!movedBlock) return blocks
        if (!fullPage.draftBlobId && !fullPage.mainBlobId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Please ensure that you have selected a valid page",
          })
        }

        // Insert at destination index
        actualBlocks.splice(to, 0, movedBlock)

        await updateBlobById(tx, {
          pageId,
          content: { ...fullPage.content, content: actualBlocks },
          siteId,
        })

        // NOTE: user given content and db state is the same at this point
        return actualBlocks
      })
    }),

  updatePage: protectedProcedure
    .input(updatePageSchema)
    .mutation(async ({ ctx, input }) => {
      await validateUserPermissions({
        userId: ctx.user.id,
        siteId: input.siteId,
        action: "update",
      })
      await updatePageById({ ...input, id: input.pageId })

      return input
    }),

  updatePageBlob: validatedPageProcedure
    .input(updatePageBlobSchema)
    .mutation(async ({ input, ctx }) => {
      await validateUserPermissions({
        userId: ctx.user.id,
        siteId: input.siteId,
        action: "update",
      })
      // @ts-expect-error we need this because we sanitise as a string
      // but this accepts a nested JSON object
      await updateBlobById(db, { ...input, pageId: input.pageId })

      return input
    }),

  createPage: protectedProcedure
    .input(createPageSchema)
    .mutation(
      async ({
        ctx,
        input: { permalink, siteId, folderId, title, layout },
      }) => {
        await validateUserPermissions({
          userId: ctx.user.id,
          siteId,
          action: "create",
          resourceId: !!folderId ? String(folderId) : null,
        })
        const newPage = createDefaultPage({ layout })

        // TODO: Validate whether folderId actually is a folder instead of a page
        // TODO: Validate whether siteId is a valid site
        // TODO: Validate user has write-access to the site
        const resource = await db
          .transaction()
          .execute(async (tx) => {
            const blob = await tx
              .insertInto("Blob")
              .values({
                content: newPage,
              })
              .returning("Blob.id")
              .executeTakeFirstOrThrow()

            const addedResource = await tx
              .insertInto("Resource")
              .values({
                title,
                permalink,
                siteId,
                parentId: folderId ? String(folderId) : undefined,
                draftBlobId: blob.id,
                type: ResourceType.Page,
              })
              .returning("Resource.id")
              .executeTakeFirstOrThrow()
            return addedResource
          })
          .catch((err) => {
            if (get(err, "code") === PG_ERROR_CODES.uniqueViolation) {
              throw new TRPCError({
                code: "CONFLICT",
                message: "A resource with the same permalink already exists",
              })
            }
            throw err
          })
        return { pageId: resource.id }
      },
    ),

  getRootPage: protectedProcedure
    .input(getRootPageSchema)
    .query(async ({ ctx, input: { siteId } }) => {
      await validateUserPermissions({
        userId: ctx.user.id,
        siteId,
        action: "read",
      })

      return (
        db
          .selectFrom("Resource")
          // TODO: Only return sites that the user has access to
          .where("Resource.siteId", "=", siteId)
          .where("Resource.type", "=", "RootPage")
          .select(["id", "title", "draftBlobId"])
          .executeTakeFirstOrThrow()
      )
    }),

  publishPage: protectedProcedure
    .input(publishPageSchema)
    .mutation(async ({ ctx, input: { siteId, pageId } }) => {
      // TODO: add permissions check here later
      /* Step 1: Update DB table to latest state */
      // Create a new version
      const addedVersionResult = await incrementVersion({
        siteId,
        pageId,
        userId: ctx.user.id,
      })

      /* Step 2: Use AWS SDK to start a CodeBuild */
      const site = await getSiteNameAndCodeBuildId(siteId)
      const codeBuildId = site.codeBuildId
      if (!codeBuildId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No CodeBuild project ID found for site",
        })
      }

      // stop any currently running builds for the site
      await stopRunningBuilds(ctx.logger, codeBuildId)

      // initiate new build
      await startProjectById(ctx.logger, codeBuildId)
      return addedVersionResult
    }),

  updateSettings: protectedProcedure
    .input(pageSettingsSchema)
    .mutation(
      async ({ ctx, input: { pageId, siteId, title, permalink, meta } }) => {
        await validateUserPermissions({
          userId: ctx.user.id,
          siteId,
          action: "update",
        })

        return db.transaction().execute(async (tx) => {
          const fullPage = await getFullPageById(tx, {
            resourceId: pageId,
            siteId,
          })

          if (!fullPage?.content) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message:
                "Unable to load content for the requested page, please contact Isomer Support",
            })
          }

          const { meta: _oldMeta, ...rest } = fullPage.content
          const pageMetaSchema = getLayoutMetadataSchema(
            fullPage.content.layout,
          )
          const validateFn = ajv.compile(pageMetaSchema)
          try {
            const newMeta = JSON.parse(
              meta,
            ) as PrismaJson.BlobJsonContent["meta"]
            const isValid = validateFn(newMeta)
            if (!isValid) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Invalid metadata",
                cause: validateFn.errors,
              })
            }
            const newContent = !meta
              ? rest
              : ({ ...rest, meta: newMeta } as PrismaJson.BlobJsonContent)

            await updateBlobById(tx, {
              pageId,
              content: newContent,
              siteId,
            })

            const updatedResource = await tx
              .updateTable("Resource")
              .where("Resource.id", "=", String(pageId))
              .where("Resource.siteId", "=", siteId)
              .where("Resource.type", "in", ["Page", "CollectionPage"])
              .set({ title, permalink })
              .returning([
                "Resource.id",
                "Resource.type",
                "Resource.title",
                "Resource.permalink",
                "Resource.draftBlobId",
              ])
              .executeTakeFirstOrThrow()
              .catch((err) => {
                if (get(err, "code") === PG_ERROR_CODES.uniqueViolation) {
                  throw new TRPCError({
                    code: "CONFLICT",
                    message:
                      "A resource with the same permalink already exists",
                  })
                }
                throw err
              })

            return {
              ...updatedResource,
              meta: newMeta,
            }
          } catch (err) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid metadata",
              cause: err,
            })
          }
        })
      },
    ),

  getFullPermalink: protectedProcedure
    .input(basePageSchema)
    .query(async ({ ctx, input }) => {
      const { pageId, siteId } = input
      await validateUserPermissions({
        userId: ctx.user.id,
        siteId,
        action: "read",
      })

      const permalink = await getResourceFullPermalink(siteId, pageId)
      if (!permalink) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No permalink could be found for the given page",
        })
      }

      return permalink
    }),
  getPermalinkTree: protectedProcedure
    .input(basePageSchema)
    .query(async ({ ctx, input }) => {
      const { pageId, siteId } = input
      await validateUserPermissions({
        userId: ctx.user.id,
        siteId,
        action: "read",
      })

      const permalinkTree = await getResourcePermalinkTree(siteId, pageId)
      if (isEmpty(permalinkTree)) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No permalink could be found for the given page",
        })
      }

      return permalinkTree
    }),
})
