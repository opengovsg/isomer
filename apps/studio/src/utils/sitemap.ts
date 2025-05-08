import type { IsomerSitemap } from "@opengovsg/isomer-components"
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { Resource } from "~prisma/generated/selectableTypes"
import { INDEX_PAGE_PERMALINK } from "~/constants/sitemap"

type ResourceDto = Omit<
  Resource,
  "id" | "parentId" | "publishedVersionId" | "draftBlobId"
> & {
  id: string
  parentId: string | null
  summary?: string
  thumbnail?: string
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
        summary: resource.summary ?? "",
        lastModified: new Date() // TODO: Update this to the updated_at field in DB
          .toISOString(),
        permalink,
        image: {
          src: resource.thumbnail ?? "",
          alt: "",
        },
      }
    }

    const indexPage = resources.find(
      (child) =>
        // NOTE: This child is the index page of this resource
        child.permalink === INDEX_PAGE_PERMALINK &&
        child.parentId === resource.id,
    )

    const titleOfPage = indexPage?.title
    const summaryOfPage = indexPage?.summary

    return {
      id: String(resource.id),
      layout: "content", // Note: We are not using the layout field in our previews
      title: titleOfPage || resource.title,
      summary: summaryOfPage ?? `Pages in ${resource.title}`,
      lastModified: new Date() // TODO: Update this to the updated_at field in DB
        .toISOString(),
      // NOTE: This permalink is unused in the preview
      permalink,
      image: !!indexPage?.thumbnail
        ? { src: indexPage.thumbnail, alt: "" }
        : undefined,
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
