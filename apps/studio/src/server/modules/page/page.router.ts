import type { IsomerSchema } from "@opengovsg/isomer-components"
import { schema } from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"
import Ajv from "ajv"
import { z } from "zod"

import { createPageSchema, getEditPageSchema } from "~/schemas/page"
import { protectedProcedure, router } from "~/server/trpc"
import { safeJsonParse } from "~/utils/safeJsonParse"
import { db, ResourceType } from "../database"
import {
  getFooter,
  getFullPageById,
  getNavBar,
} from "../resource/resource.service"
import { getSiteConfig } from "../site/site.service"
import { createDefaultPage } from "./page.service"

const ajv = new Ajv({ allErrors: true, strict: false, logger: false })
const schemaValidator = ajv.compile<IsomerSchema>(schema)

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
    .query(async ({ input: { siteId, resourceId } }) => {
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
          "Resource.mainBlobId",
          "Resource.draftBlobId",
          "Resource.type",
        ])
        .execute()
    }),
  readPageAndBlob: protectedProcedure
    .input(getEditPageSchema)
    .query(async ({ input: { pageId, siteId } }) => {
      // TODO: Return blob last modified so the renderer can show last modified
      const page = await getFullPageById({ resourceId: pageId, siteId })
      if (!page) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resource not found",
        })
      }
      const permalink = page.permalink
      const siteMeta = await getSiteConfig(page.siteId)
      const navbar = await getNavBar(page.siteId)
      const footer = await getFooter(page.siteId)
      const { content } = page

      return {
        permalink,
        navbar,
        footer,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore type instantiation is excessively deep and possibly infinite
        content,
        ...siteMeta,
      }
    }),
  createPage: protectedProcedure
    .input(createPageSchema)
    .mutation(
      async ({ input: { permalink, siteId, folderId, title, layout } }) => {
        const newPage = createDefaultPage({ title, layout })

        // TODO: Validate whether folderId actually is a folder instead of a page
        // TODO: Validate whether siteId is a valid site
        // TODO: Validate user has write-access to the site
        const resource = await db.transaction().execute(async (tx) => {
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
        return { pageId: resource.id }
      },
    ),
})
