import type { CollectionPageCategoryOption } from "@opengovsg/isomer-components"
import type { UnwrapTagged } from "type-fest"
import type { NEW_PAGE_LAYOUT_VALUES } from "~/schemas/page"
import {
  DEFAULT_CHILDREN_PAGES_BLOCK,
  ISOMER_USABLE_PAGE_LAYOUTS,
} from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"
import { format } from "date-fns"
import { ResourceType } from "~prisma/generated/generatedEnums"

import { db, sql } from "../database"

export const createDefaultPage = ({
  layout,
}: {
  layout: (typeof NEW_PAGE_LAYOUT_VALUES)[number]
}) => {
  switch (layout) {
    case "content": {
      const contentDefaultPage = {
        layout: ISOMER_USABLE_PAGE_LAYOUTS.Content,
        page: { contentPageHeader: { summary: "This is the page summary" } },
        content: [],
        version: "0.1.0",
      } satisfies UnwrapTagged<PrismaJson.BlobJsonContent>
      return contentDefaultPage
    }

    case "article": {
      const articleDefaultPage = {
        layout: ISOMER_USABLE_PAGE_LAYOUTS.Article,
        page: {
          date: format(new Date(), "dd/MM/yyyy"),
          category: "Feature Articles",
          articlePageHeader: { summary: "This is the page summary" },
        },
        content: [],
        version: "0.1.0",
      } satisfies UnwrapTagged<PrismaJson.BlobJsonContent>

      return articleDefaultPage
    }

    case "database": {
      const databaseDefaultPage = {
        layout: ISOMER_USABLE_PAGE_LAYOUTS.Database,
        page: {
          contentPageHeader: { summary: "This is the page summary" },
          database: {
            dataSource: {
              type: "dgs", // we only support DGS creation on studio for now
              // Hardcoded: One of the most popular datasets on Data.gov.sg, so unlikely to be removed
              // Either way, this is just a placeholder, unlikely agency will publish with this
              resourceId: "d_3c55210de27fcccda2ed0c63fdd2b352",
            },
          },
        },
        content: [],
        version: "0.1.0",
      } satisfies UnwrapTagged<PrismaJson.BlobJsonContent>

      return databaseDefaultPage
    }

    default: {
      const _exhaustiveCheck: never = layout
      return _exhaustiveCheck
    }
  }
}

export const createFolderIndexPage = (title: string) => {
  return {
    version: "0.1.0",
    layout: ISOMER_USABLE_PAGE_LAYOUTS.Index,
    // NOTE: cannot use placeholder values here
    // because this are used for generation of breadcrumbs
    // and the page title
    page: {
      title,
      lastModified: new Date().toISOString(),
      contentPageHeader: { summary: `Pages in ${title}` },
    },
    content: [DEFAULT_CHILDREN_PAGES_BLOCK],
  } satisfies UnwrapTagged<PrismaJson.BlobJsonContent>
}

function isCollectionPageCategoryOption(
  value: unknown,
): value is CollectionPageCategoryOption {
  if (!value || typeof value !== "object") {
    return false
  }
  const rec = value as Record<string, unknown>
  return typeof rec.id === "string" && typeof rec.label === "string"
}

export const getCategoryOptionsForPage = async ({
  siteId,
  pageId,
}: {
  siteId: number
  pageId: number
}): Promise<{ categoryOptions: CollectionPageCategoryOption[] }> => {
  const page = await db
    .selectFrom("Resource as r")
    .innerJoin("Resource as parent", "parent.id", "r.parentId")
    .where("r.siteId", "=", siteId)
    .where("r.id", "=", String(pageId))
    .select(["r.parentId", "parent.type as parentType"])
    .executeTakeFirst()

  if (!page?.parentId) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Page not found",
    })
  }

  if (page.parentType !== ResourceType.Collection) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Page is not a child of a Collection",
    })
  }

  // Intentionally reads only from the published index blob: child pages/links
  // may only choose from category options that have been published on the
  // collection index. Newly-added or edited options are not selectable until
  // the index is published.
  const row = await db
    .selectFrom("Resource as r")
    .innerJoin("Version as v", "r.publishedVersionId", "v.id")
    .innerJoin("Blob as vb", "v.blobId", "vb.id")
    .where("r.siteId", "=", siteId)
    .where("r.parentId", "=", page.parentId)
    .where("r.type", "=", ResourceType.IndexPage)
    .select(
      sql<
        CollectionPageCategoryOption[] | null
      >`vb.content->'page'->'categoryOptions'`.as("categoryOptions"),
    )
    .executeTakeFirst()

  const raw = row?.categoryOptions
  return {
    categoryOptions: Array.isArray(raw)
      ? raw.filter(isCollectionPageCategoryOption)
      : [],
  }
}
