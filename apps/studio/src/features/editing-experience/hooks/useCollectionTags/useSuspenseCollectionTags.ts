import { trpc } from "~/utils/trpc"

import type { UseCollectionTagsInput } from "./types"

export function useSuspenseCollectionTags({
  resourceId,
  siteId,
}: Omit<UseCollectionTagsInput, "enabled">) {
  return trpc.collection.getCollectionTags.useSuspenseQuery({
    resourceId,
    siteId,
  })
}
