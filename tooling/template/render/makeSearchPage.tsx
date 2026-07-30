import { makeLayoutPage } from "@/render/makeLayoutPage"
import { SearchRenderEngine } from "@/render/searchLayout"

export function makeSearchPage(normalizedPermalink: string) {
  return makeLayoutPage(normalizedPermalink, SearchRenderEngine)
}
