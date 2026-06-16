import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import { REF_INTERNAL_HREF_PATTERN } from "../../utils/validation"

export const LocalSearchSchema = Type.Object({
  type: Type.Literal("localSearch", { default: "localSearch" }),
  searchUrl: Type.String({
    title: "Search URL",
    description:
      "The URL to which the search query will be sent. This should point to a local search endpoint.",
    format: "hidden",
    // Relative paths or internal resource references only — prevents open redirect
    // if a site admin sets this to an external URL
    pattern: REF_INTERNAL_HREF_PATTERN,
  }),
})

export type LocalSearchProps = Static<typeof LocalSearchSchema> & {
  className?: string
}
