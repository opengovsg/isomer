import type { UnwrapTagged } from "type-fest"
import type { NEW_PAGE_LAYOUT_VALUES } from "~/schemas/page"
import {
  DEFAULT_CHILDREN_PAGES_BLOCK,
  ISOMER_USABLE_PAGE_LAYOUTS,
} from "@opengovsg/isomer-components"
import { format } from "date-fns"
import { get, isEqual } from "lodash-es"

import { bulkValidateUserPermissionsForResources } from "../permissions/permissions.service"

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

/**
 * Collection Filters (`tagCategories`) are UI-gated to site Admins via
 * `canManageCollectionFilters`. Callers with page-update access can still hit
 * `page.updatePageBlob` directly, so when `page.tagCategories` changes, run
 * the same CASL check the client uses (`can("create", { parentId: null })`).
 * Throws FORBIDDEN if the caller fails it.
 *
 * No-op for non-collection layouts. `tagCategories` only exists on the
 * collection layout's `page` schema.
 */
export const assertTagCategoriesUnchangedForNonSiteAdmin = async ({
  userId,
  siteId,
  oldContent,
  newContent,
}: {
  userId: string
  siteId: number
  oldContent: UnwrapTagged<PrismaJson.BlobJsonContent>
  newContent: UnwrapTagged<PrismaJson.BlobJsonContent>
}): Promise<void> => {
  const isCollectionIndexPage =
    get(oldContent, "layout") === ISOMER_USABLE_PAGE_LAYOUTS.Collection ||
    get(newContent, "layout") === ISOMER_USABLE_PAGE_LAYOUTS.Collection

  if (!isCollectionIndexPage) return

  const tagCategoriesUnchanged = isEqual(
    get(oldContent, "page.tagCategories"),
    get(newContent, "page.tagCategories"),
  )

  if (tagCategoriesUnchanged) return

  await bulkValidateUserPermissionsForResources({
    userId,
    siteId,
    action: "create",
    resourceIds: [null],
  })
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
