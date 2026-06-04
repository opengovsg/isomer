import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

export const LocalSearchSchema = Type.Object({
  type: Type.Literal("localSearch", { default: "localSearch" }),
  searchUrl: Type.String({
    title: "Search URL",
    description:
      "The URL to which the search query will be sent. This should point to a local search endpoint.",
    format: "hidden",
    // Relative paths only — prevents open redirect if a site admin sets this to an external URL
    pattern: "^/",
  }),
})

export type LocalSearchProps = Static<typeof LocalSearchSchema> & {
  className?: string
}
