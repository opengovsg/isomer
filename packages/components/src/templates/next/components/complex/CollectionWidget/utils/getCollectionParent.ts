import type { IsomerSitemap, IsomerSiteProps } from "~/types"
import { getResourceIdFromReferenceLink } from "~/utils"

interface GetCollectionParentProps {
  site: IsomerSiteProps
  collectionReferenceLink: string
}

export const getCollectionParent = ({
  site,
  collectionReferenceLink,
}: GetCollectionParentProps): IsomerSitemap => {
  const collectionId = getResourceIdFromReferenceLink(collectionReferenceLink)

  // Iteratively search the siteMap tree for the collection node by ID
  // Using BFS to find the collection parent, starting from the root
  const queue: IsomerSitemap[] = [site.siteMap]

  while (queue.length > 0) {
    const currentNode = queue.shift()
    if (!currentNode) continue

    // Parent node found
    if (currentNode.id === collectionId) {
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
