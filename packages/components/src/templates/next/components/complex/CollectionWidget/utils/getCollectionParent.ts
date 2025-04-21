import type { IsomerSitemap, IsomerSiteProps } from "~/types"
import type { IsomerCollectionPageSitemap } from "~/types/sitemap"
import { getResourceIdFromReferenceLink } from "~/utils"

const isCollectionParent = (
  node: IsomerSitemap,
  collectionId: string,
): node is IsomerCollectionPageSitemap => {
  return node.id === collectionId && node.layout === "collection"
}

interface GetCollectionParentProps {
  site: IsomerSiteProps
  collectionReferenceLink: string
}

export const getCollectionParent = ({
  site,
  collectionReferenceLink,
}: GetCollectionParentProps): IsomerCollectionPageSitemap => {
  const collectionId = getResourceIdFromReferenceLink(collectionReferenceLink)

  // Iteratively search the siteMap tree for the collection node by ID
  // Using BFS to find the collection parent, starting from the root
  const queue: IsomerSitemap[] = [site.siteMap]

  while (queue.length > 0) {
    const currentNode = queue.shift()
    if (!currentNode) continue

    if (isCollectionParent(currentNode, collectionId)) {
      return currentNode
    }

    if (currentNode.children && currentNode.children.length > 0) {
      queue.push(...currentNode.children)
    }
  }

  throw new Error(
    `CollectionWidget: No collection parent found for reference link ${collectionReferenceLink}`,
  )
}
