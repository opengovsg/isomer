import type { IsomerSitemap } from "@opengovsg/isomer-components"
import type { Resource } from "@prisma/client"

import { INDEX_PAGE_PERMALINK } from "~/constants/sitemap"

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
      return resource.parentId === null && resource.type !== "RootPage"
    }
    return (
      resource.parentId === parentId &&
      resource.permalink !== INDEX_PAGE_PERMALINK
    )
  })

  return children.map((resource) => {
    const permalink = `${path}${resource.permalink}`

    console.log("permalink", permalink)
    if (resource.type === "Page" || resource.type === "CollectionPage") {
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

    const idOfPage = resources.find(
      (child) =>
        // NOTE: This child is the index page of this resource
        child.permalink === INDEX_PAGE_PERMALINK &&
        child.parentId === resource.id,
    )?.id

    return {
      id: String(idOfPage ?? resource.id),
      layout: "content", // Note: We are not using the layout field in our previews
      title: resource.title,
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
    layout: "content", // Note: We are not using the layout field in our previews
    title: rootResource.title,
    summary: "", // Note: We are not using the summary field in our previews
    lastModified: new Date() // TODO: Update this to the updated_at field in DB
      .toISOString(),
    // NOTE: This permalink is unused in the preview
    permalink: "/",
    children: getSitemapTreeFromArray(resources, null, "/"),
  }
}
