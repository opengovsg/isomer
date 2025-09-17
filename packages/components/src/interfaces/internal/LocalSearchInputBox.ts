import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

export const LocalSearchSchema = Type.Object({
  type: Type.Literal("localSearch", { default: "localSearch" }),
  // FIXME: This should be fixed to /search
  searchUrl: Type.String({
    title: "Search URL",
    description:
      "The URL to which the search query will be sent. This should point to a local search endpoint.",
    format: "link",
  }),
})

export type LocalSearchProps = Static<typeof LocalSearchSchema> & {
  className?: string
}
