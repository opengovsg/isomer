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
      return resource.parentId === null && resource.type !== "RootPage"
    }
    return resource.parentId === parentId
  })

  // Filter out duplicate resources with the same permalink, keeping only the
  // Folder or Collection resource, then re-assigning the parentId of the
  // children to the Folder or Collection resource
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
    .filter(
      (child) =>
        !(
          child.type === "CollectionPage" &&
          children.some(
            (otherChild) =>
              otherChild.id !== child.id &&
              otherChild.permalink === child.permalink &&
              otherChild.type === "Collection",
          )
        ),
    )
    .map((resource) => {
      const permalink = `${path}${resource.permalink}`

      if (
        resource.type === "RootPage" ||
        resource.type === "Page" ||
        resource.type === "CollectionPage"
      ) {
        return {
          id: String(resource.id),
          layout: "content", // Note: We are not using the layout field in our previews
          title: resource.title,
          summary: "", // Note: We are not using the summary field in our previews
          lastModified: new Date() // TODO: Update this to the updated_at field in DB
            .toISOString(),
          permalink,
        }
      }

      const idOfPage = children.find(
        (child) =>
          child.id !== resource.id &&
          child.permalink === resource.permalink &&
          child.type ===
            (resource.type === "Folder" ? "Page" : "CollectionPage"),
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
