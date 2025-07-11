import type { IsomerSitemap } from "~/types"

export type ChildPage = Pick<IsomerSitemap, "id" | "title" | "image"> & {
  url: IsomerSitemap["permalink"]
  description: IsomerSitemap["summary"]
}
