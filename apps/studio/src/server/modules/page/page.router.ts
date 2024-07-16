import { schema } from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"
import Ajv from "ajv"

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

const ajv = new Ajv({ allErrors: true, strict: false })
const schemaValidator = ajv.compile(schema)

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
  list: protectedProcedure.query(() => {
    const dummyChildData: {
      id: string
      name: string
      permalink: string
      type: "page" | "folder"
      status: "folder" | "draft" | "published"
      lastEditUser: string
      lastEditDate: Date | "folder"
    }[] = [
      {
        id: "0001",
        name: "Test Page 1",
        permalink: "/",
        type: "page",
        status: "draft",
        lastEditUser: "user1@test.com",
        lastEditDate: new Date("2024-07-15T09:16:46.640Z"),
      },
      {
        id: "0002",
        name: "Test Page 2",
        permalink: "/testpage2",
        type: "page",
        status: "published",
        lastEditUser: "user2@test.com",
        lastEditDate: new Date("2024-06-15T09:16:46.640Z"),
      },
      {
        id: "0003",
        name: "Test Folder 1",
        permalink: "/testfolder1",
        type: "folder",
        status: "folder",
        lastEditUser: "folder",
        lastEditDate: "folder",
      },
      {
        id: "0004",
        name: "Test Folder 2",
        permalink: "/testfolder2",
        type: "folder",
        status: "folder",
        lastEditUser: "folder",
        lastEditDate: "folder",
      },
      {
        id: "0005",
        name: "Test Page 5",
        permalink: "/",
        type: "page",
        status: "draft",
        lastEditUser: "user1@test.com",
        lastEditDate: new Date("2024-07-15T09:16:46.640Z"),
      },
      {
        id: "0006",
        name: "Test Folder 6",
        permalink: "/testfolder6",
        type: "folder",
        status: "folder",
        lastEditUser: "folder",
        lastEditDate: "folder",
      },
      {
        id: "0007",
        name: "Test Page 7",
        permalink: "/testpage7",
        type: "page",
        status: "published",
        lastEditUser: "user7@test.com",
        lastEditDate: new Date("2024-06-15T09:16:46.640Z"),
      },
      {
        id: "0008",
        name: "Test Folder 8",
        permalink: "/testfolder8",
        type: "folder",
        status: "folder",
        lastEditUser: "folder",
        lastEditDate: "folder",
      },
      {
        id: "0009",
        name: "Test Folder 9",
        permalink: "/testfolder9",
        type: "folder",
        status: "folder",
        lastEditUser: "folder",
        lastEditDate: "folder",
      },
      {
        id: "0010",
        name: "Test Page 10",
        permalink: "/testpage10",
        type: "page",
        status: "published",
        lastEditUser: "user2@test.com",
        lastEditDate: new Date("2024-06-15T09:16:46.640Z"),
      },
      {
        id: "0011",
        name: "Test Folder 11",
        permalink: "/testfolder11",
        type: "folder",
        status: "folder",
        lastEditUser: "folder",
        lastEditDate: "folder",
      },
      {
        id: "0012",
        name: "Test Page 12",
        permalink: "/testpage12",
        type: "page",
        status: "draft",
        lastEditUser: "user1@test.com",
        lastEditDate: new Date("2024-07-15T09:16:46.640Z"),
      },
      {
        id: "0013",
        name: "Test Folder 13",
        permalink: "/testfolder13",
        type: "folder",
        status: "folder",
        lastEditUser: "folder",
        lastEditDate: "folder",
      },
    ]
    // TODO: Implement actual data fetching
    return dummyChildData
  }),
  readPageAndBlob: protectedProcedure
    .input(getEditPageSchema)
    .query(async ({ input: { pageId, siteId } }) => {
      const page = await getFullPageById({ resourceId: pageId, siteId })
      if (!page) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resource not found",
        })
      }
      const pageName = page.permalink
      const siteMeta = await getSiteConfig(page.siteId)
      const navbar = await getNavBar(page.siteId)
      const footer = await getFooter(page.siteId)
      const { content } = page

      return {
        pageName,
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
      async ({
        input: { permalink: pageUrl, siteId, folderId, title: pageTitle },
      }) => {
        // TODO: Validate whether folderId actually is a folder instead of a page
        // TODO: Validate whether siteId is a valid site
        // TODO: Validate user has write-access to the site
        const resource = await db.transaction().execute(async (tx) => {
          const blob = await tx
            .insertInto("Blob")
            .values({
              content: {
                // TODO: Remove title from content blob after all titles are retrieved from Resource
                page: { title: pageTitle },
                layout: "homepage",
                content: [],
                version: "0.1.0",
              },
            })
            .returning("Blob.id")
            .executeTakeFirstOrThrow()

          const addedResource = await tx
            .insertInto("Resource")
            .values({
              title: pageTitle,
              permalink: pageUrl,
              siteId,
              parentId: folderId,
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
