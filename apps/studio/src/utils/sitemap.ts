import type { IsomerSitemap } from "@opengovsg/isomer-components"
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { Resource } from "~prisma/generated/selectableTypes"

export const PAGE_RESOURCE_TYPES = [
  ResourceType.Page,
  ResourceType.CollectionPage,
  ResourceType.CollectionLink,
  ResourceType.IndexPage,
  ResourceType.RootPage,
] as const
type ResourceDto = Omit<
  Resource,
  "id" | "parentId" | "publishedVersionId" | "draftBlobId"
> & {
  id: string
  parentId: string | null
  summary?: string
  thumbnail?: string
}

const getResourcesWithFullPermalink = (
  resources: ResourceDto[],
  parent: ResourceDto,
): ResourceDto[] => {
  const children = resources
    .filter((resources) => {
      return parent.type === ResourceType.RootPage
        ? resources.parentId === null
        : resources.parentId === parent.id
    })
    .map((child) => {
      return {
        ...child,
        permalink: `${parent.type === ResourceType.RootPage ? "" : parent.permalink}/${child.permalink}`,
      }
    })

  return [
    ...children,
    ...children.flatMap((child) =>
      getResourcesWithFullPermalink(resources, child),
    ),
  ]
}

const getSitemapTreeFromArray = (
  resources: ResourceDto[],
  parentId: string | null,
): IsomerSitemap[] | undefined => {
  if (resources.length === 0) {
    return undefined
  }

  // Get the immediate children of the resource with the given parent ID
  const children = resources
    .filter((resource) => {
      const hasPageChildren = resources.some((possibleChild) => {
        return (
          possibleChild.permalink.startsWith(resource.permalink) &&
          PAGE_RESOURCE_TYPES.find((t) => t === possibleChild.type)
        )
      })
      return (
        PAGE_RESOURCE_TYPES.find((t) => t === resource.type) || hasPageChildren
      )
    })
    .filter((resource) => {
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
        resource.type !== ResourceType.IndexPage
      )
    })

  // TODO: Sort the children by the page ordering if the FolderMeta resource exists
  return children.map((resource) => {
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
        permalink: resource.permalink,
        image: {
          src: resource.thumbnail ?? "",
          alt: "",
        },
      }
    }

    const indexPage = resources.find(
      (child) =>
        // NOTE: This child is the index page of this resource
        child.type === ResourceType.IndexPage && child.parentId === resource.id,
    )

    if (!!indexPage) {
      return {
        id: String(resource.id),
        layout: "content", // Note: We are not using the layout field in our previews
        title: indexPage.title,
        summary: indexPage.summary ?? `Pages in ${resource.title}`,
        lastModified: new Date() // TODO: Update this to the updated_at field in DB
          .toISOString(),
        // NOTE: This permalink is unused in the preview
        permalink: resource.permalink,
        image: !!indexPage.thumbnail
          ? { src: indexPage.thumbnail, alt: "" }
          : undefined,
        children: getSitemapTreeFromArray(resources, resource.id),
      }
    }

    return {
      id: String(resource.id),
      layout: "content", // Note: We are not using the layout field in our previews
      title: resource.title,
      summary: `Pages in ${resource.title}`,
      lastModified: new Date() // TODO: Update this to the updated_at field in DB
        .toISOString(),
      // NOTE: This permalink is unused in the preview
      permalink: resource.permalink,
      children: getSitemapTreeFromArray(resources, resource.id),
    }
  })
}

// Construct the sitemap tree given an array of individual sitemap items
export const getSitemapTree = (
  rootResource: ResourceDto,
  resources: ResourceDto[],
): IsomerSitemap => {
  const resourcesWithFullPermalink = getResourcesWithFullPermalink(
    resources,
    rootResource,
  )

  return {
    id: String(rootResource.id),
    layout: "homepage", // Note: We are not using the layout field in our previews
    title: rootResource.title,
    summary: "", // Note: We are not using the summary field in our previews
    lastModified: new Date() // TODO: Update this to the updated_at field in DB
      .toISOString(),
    // NOTE: This permalink is unused in the preview
    permalink: "/",
    children: getSitemapTreeFromArray(resourcesWithFullPermalink, null),
  }
}
