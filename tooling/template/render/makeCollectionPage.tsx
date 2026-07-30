import { CollectionRenderEngine } from "@/render/collectionLayout"
import { makeLayoutPage } from "@/render/makeLayoutPage"

export function makeCollectionPage(normalizedPermalink: string) {
  return makeLayoutPage(normalizedPermalink, CollectionRenderEngine)
}
