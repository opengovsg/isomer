/* oxlint-disable import/no-cycle, unicorn/no-nested-ternary -- core cleanup deferred */
import { skipToken } from "@tanstack/react-query"
import { useQueryParse } from "~/hooks/useQueryParse"
import { sitePageSchema } from "~/pages/sites/[siteId]/sitePageSchema"
import { isResourceMoveValid } from "~/utils/resources"
import { trpc } from "~/utils/trpc"
import {
  hasNonEmptyString,
  isDefinedNumber,
  isNullableBooleanTrue,
  isNonEmptyArray,
} from "~/utils/truthiness"
import { ResourceType } from "~prisma/generated/generatedEnums"

export const useValidateResourceMove = ({
  sourceId,
  destinationId,
}: {
  sourceId?: string
  // NOTE: null if moving to root
  destinationId: string | null
}) => {
  const { siteId } = useQueryParse(sitePageSchema)
  const { data: source, isLoading: isSourceLoading } =
    trpc.resource.getMetadataById.useQuery(
      hasNonEmptyString(sourceId)
        ? { resourceId: sourceId, siteId }
        : skipToken,
    )
  const { data: destination, isLoading: isDestinationLoading } =
    trpc.resource.getMetadataById.useQuery(
      destinationId === null
        ? skipToken
        : { resourceId: destinationId, siteId },
    )

  const { data: rootPage, isLoading: isRootPageLoading } =
    trpc.page.getRootPage.useQuery(
      destinationId === null ? { siteId } : skipToken,
    )

  // NOTE: getRootPage only selects a minimal projection (id/title/draftBlobId)
  // since it's shared with unrelated previews. Its `id` is the only field
  // isResourceMoveValid actually reads off the destination when moving to
  // root — the rest are structurally required but functionally unused, so
  // they're safe to fill in as the known constants for the root resource.
  const destinationResource =
    destinationId === null
      ? rootPage && {
          id: rootPage.id,
          parentId: null,
          permalink: "/",
          siteId,
          type: ResourceType.RootPage,
        }
      : destination

  const isValidMove =
    !!source &&
    !!destinationResource &&
    isResourceMoveValid(source, destinationResource)

  const errorMessage =
    // oxlint-disable-next-line eslint/no-nested-ternary -- core cleanup deferred
    isValidMove instanceof Error
      ? isValidMove.message
      : isValidMove
        ? undefined
        : "Invalid resource move"

  return {
    errorMessage,
    isLoading: isSourceLoading || isDestinationLoading || isRootPageLoading,
    isValidMove,
  }
}
