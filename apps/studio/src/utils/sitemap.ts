import type { IsomerSitemap } from "@opengovsg/isomer-components"
import type { Resource } from "@prisma/client"

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

  const children = resources.filter((resource) => {
    if (parentId === null) {
      return resource.parentId === null && resource.permalink !== ""
    }
    return resource.parentId === parentId
  })

  // Filter out children that have both the Page and the Folder types and keep
  // only the one with the Folder type, then reassign the ID to the ID of the
  // resource with the Page type
  return children
    .filter(
      (child) =>
        !(
          child.type === "Page" &&
          children.some(
            (otherChild) =>
              otherChild.id !== child.id &&
              otherChild.permalink === child.permalink &&
              otherChild.type === "Folder",
          )
        ),
    )
    .map((resource) => {
      const permalink = `${path}${resource.permalink}`
      if (resource.type === "Folder") {
        const idOfPage = children.find(
          (child) =>
            child.id !== resource.id &&
            child.permalink === resource.permalink &&
            child.type === "Page",
        )?.id

        const folderChildren = resources.filter(
          (item) => item.parentId === resource.id,
        )

        return {
          id: String(idOfPage ?? resource.id),
          layout: "content", // Note: We are not using the layout field in our previews
          title: resource.title,
          summary: "", // Note: We are not using the summary field in our previews
          lastModified: new Date() // TODO: Update this to the updated_at field in DB
            .toISOString(),
          permalink,
          children: getSitemapTreeFromArray(
            folderChildren,
            resource.id,
            `${permalink}/`,
          ),
        }
      }

      return {
        id: String(resource.id),
        layout: "content", // Note: We are not using the layout field in our previews
        title: resource.title,
        summary: "", // Note: We are not using the summary field in our previews
        lastModified: new Date() // TODO: Update this to the updated_at field in DB
          .toISOString(),
        permalink,
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
    permalink: "/",
    children: getSitemapTreeFromArray(resources, null, "/"),
  }
}
