import { DatabaseRenderEngine } from "@/render/databaseLayout"
import { makeLayoutPage } from "@/render/makeLayoutPage"

export function makeDatabasePage(normalizedPermalink: string) {
  return makeLayoutPage(normalizedPermalink, DatabaseRenderEngine)
}
