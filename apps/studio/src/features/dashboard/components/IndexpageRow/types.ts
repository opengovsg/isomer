import type { z } from "zod"

import type { getIndexpageSchema } from "~/schemas/folder"

export type ResourceTypesWithIndexPage = "collection" | "folder"

export type IndexpageRowProps = z.infer<typeof getIndexpageSchema> & {
  type: ResourceTypesWithIndexPage
}
