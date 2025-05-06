import type { IsomerSitemap } from "@opengovsg/isomer-components"
import { ISOMER_USABLE_PAGE_LAYOUTS } from "@opengovsg/isomer-components"
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { Resource } from "~prisma/generated/selectableTypes"
import { INDEX_PAGE_PERMALINK } from "~/constants/sitemap"
import { env } from "~/env.mjs"

type ResourceDto = Omit<
  Resource,
  "id" | "parentId" | "publishedVersionId" | "draftBlobId"
> & {
  id: string
  parentId: string | null
}

const getSitemapTreeFromArray = (
  resources: ResourceDto[],
  parentId: string | null,
  path: string,
): IsomerSitemap[] | undefined => {
  if (resources.length === 0) {
    return undefined
  }

  // Get the immediate children of the resource with the given parent ID
  const children = resources.filter((resource) => {
    if (parentId === null) {
      return (
        resource.parentId === null &&
        resource.type !== ResourceType.RootPage &&
        resource.type !== ResourceType.FolderMeta &&
        resource.type !== ResourceType.CollectionMeta
      )
    }
    return (
      resource.parentId === parentId &&
      resource.permalink !== INDEX_PAGE_PERMALINK
    )
  })

  // TODO: Sort the children by the page ordering if the FolderMeta resource exists
  return children.map((resource) => {
    const permalink = `${path}${resource.permalink}`

    if (
      resource.type === ResourceType.Page ||
      resource.type === ResourceType.CollectionPage
    ) {
      return {
        id: String(resource.id),
        layout: "content", // Note: We are not using the layout field in our sitemap for preview
        title: resource.title,
        summary: "", // Note: We are not using the summary field in our previews
        lastModified: new Date() // TODO: Update this to the updated_at field in DB
          .toISOString(),
        permalink,
      }
    }

    const titleOfPage = resources.find(
      (child) =>
        // NOTE: This child is the index page of this resource
        child.permalink === INDEX_PAGE_PERMALINK &&
        child.parentId === resource.id,
    )?.title

    return {
      id: String(resource.id),
      layout:
        resource.type === ResourceType.Collection
          ? ISOMER_USABLE_PAGE_LAYOUTS.Collection // Needed for collectionblock component to fetch the correct collection
          : ISOMER_USABLE_PAGE_LAYOUTS.Content, // Note: We are not using the layout field in our previews
      title: titleOfPage || resource.title,
      summary: "", // Note: We are not using the summary field in our previews
      lastModified: new Date() // TODO: Update this to the updated_at field in DB
        .toISOString(),
      // NOTE: This permalink is unused in the preview
      permalink,
      children: getSitemapTreeFromArray(
        resources,
        resource.id,
        `${permalink}/`,
      ),
    }
  })
}

// Construct the sitemap tree given an array of individual sitemap items
export const getSitemapTree = (
  rootResource: ResourceDto,
  resources: ResourceDto[],
): IsomerSitemap => {
  return {
    id: String(rootResource.id),
    layout: "homepage", // Note: We are not using the layout field in our previews
    title: rootResource.title,
    summary: "", // Note: We are not using the summary field in our previews
    lastModified: new Date() // TODO: Update this to the updated_at field in DB
      .toISOString(),
    // NOTE: This permalink is unused in the preview
    permalink: "/",
    children: getSitemapTreeFromArray(resources, null, "/"),
  }
}

export const overwriteCollectionChildrenForCollectionBlock = (
  sitemap: IsomerSitemap,
): IsomerSitemap => {
  // If the current node is a collection, overwrite its children and return
  if (sitemap.layout === ISOMER_USABLE_PAGE_LAYOUTS.Collection) {
    return {
      ...sitemap,
      children: Array.from({ length: 3 }).map((_, idx) => ({
        id: `collection-card-${idx}`,
        title: "Article title",
        summary: "Article summary",
        permalink: "/",
        layout: ISOMER_USABLE_PAGE_LAYOUTS.Article,
        lastModified: new Date().toISOString(),
        category: "Category of article",
        children: [],
        ref: "https://www.google.com",
        image: {
          src: `${env.NEXT_PUBLIC_APP_URL}/assets/collectionblock_studio_preview.svg`,
          alt: "Placeholder image for article's thumbnail",
        },
      })),
    }
  }

  let processedChildren = sitemap.children

  // If the node is not a collection, process its children (if any)
  if (sitemap.children) {
    processedChildren = sitemap.children.map((child) =>
      overwriteCollectionChildrenForCollectionBlock(child),
    )
  }

  // Return the non-collection node with potentially updated children
  return {
    ...sitemap,
    children: processedChildren,
  }
}
