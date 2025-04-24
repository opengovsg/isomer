import type { IsomerSitemap, IsomerSiteProps } from "~/types"
import type { IsomerCollectionPageSitemap } from "~/types/sitemap"

const isCollectionParent = (
  node: IsomerSitemap,
  collectionId: string,
): node is IsomerCollectionPageSitemap => {
  return node.id === collectionId && node.layout === "collection"
}

interface GetCollectionParentProps {
  site: IsomerSiteProps
  collectionId: string
}

export const getCollectionParent = ({
  site,
  collectionId,
}: GetCollectionParentProps): IsomerCollectionPageSitemap => {
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
    `CollectionBlock: No collection parent found for collection ID ${collectionId}`,
  )
}
