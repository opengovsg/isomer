import { IsomerSitemap } from "~/types"
import { getNodeFromSiteMap } from "./getNodeFromSiteMap"

export const getIndexByPermalink = (
  permalink: string,
  siteMap: IsomerSitemap,
) => {
  // NOTE: the permalink of a page never ends with a `/`
  const parentPermalink = permalink.split("/").slice(0, -1).join("/")
  const parent = getNodeFromSiteMap(siteMap, parentPermalink)

  return parent
}
