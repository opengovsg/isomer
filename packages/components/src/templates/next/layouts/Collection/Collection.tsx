import type { CollectionPageSchemaType, IsomerSitemap } from "~/engine"
import type { CollectionCardProps } from "~/interfaces"
import { getBreadcrumbFromSiteMap, getSitemapAsArray } from "~/utils"
import { Skeleton } from "../Skeleton"
import CollectionClient from "./CollectionClient"

const getCollectionItems = (
  siteMap: IsomerSitemap,
  permalink: string,
): CollectionCardProps[] => {
  let currSitemap = siteMap
  const permalinkParts = permalink.split("/")

  for (let i = 2; i <= permalinkParts.length; i++) {
    const currPermalink = permalinkParts.slice(0, i).join("/")

    if (!currSitemap.children) {
      return []
    }

    const child = currSitemap.children.find(
      (child) => child.permalink === currPermalink,
    )

    if (!child) {
      return []
    }

    currSitemap = child
  }

  if (!currSitemap.children) {
    return []
  }

  const items = currSitemap.children.flatMap((child) =>
    getSitemapAsArray(child),
  )

  return items
    .filter(
      (item) =>
        item.layout === "file" ||
        item.layout === "link" ||
        item.layout === "article",
    )
    .map((item) => {
      const date = new Date(item.date || item.lastModified)
      const lastUpdated =
        date.getDate().toString().padStart(2, "0") +
        " " +
        date.toLocaleString("default", { month: "long" }) +
        " " +
        date.getFullYear()

      const baseItem = {
        type: "collectionCard" as const,
        lastUpdated,
        category: item.category || "Others",
        title: item.title,
        description: item.summary,
        image: item.image,
      }

      if (item.layout === "file") {
        return {
          ...baseItem,
          variant: "file",
          url: item.ref,
          fileDetails: item.fileDetails,
        }
      } else if (item.layout === "link") {
        return {
          ...baseItem,
          variant: "link",
          url: item.ref,
        }
      }

      return {
        ...baseItem,
        variant: "article",
        url: item.permalink,
      }
    })
}

const CollectionLayout = ({
  site,
  page,
  layout,
  LinkComponent,
  ScriptComponent,
}: CollectionPageSchemaType) => {
  const { permalink } = page
  const { siteMap } = site

  const items = getCollectionItems(siteMap, permalink)
  const breadcrumb = getBreadcrumbFromSiteMap(
    site.siteMap,
    page.permalink.split("/").slice(1),
  )

  return (
    <Skeleton
      site={site}
      page={page}
      layout={layout}
      LinkComponent={LinkComponent}
      ScriptComponent={ScriptComponent}
    >
      <CollectionClient
        page={page}
        breadcrumb={breadcrumb}
        LinkComponent={LinkComponent}
        items={items}
      />
    </Skeleton>
  )
}

export default CollectionLayout
