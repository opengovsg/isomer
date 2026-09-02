import {
  HStack,
  Icon,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Portal,
  Skeleton,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import { Button, IconButton } from "@opengovsg/design-system-react"
import { BiDotsHorizontalRounded, BiHide } from "react-icons/bi"
import { Can } from "~/features/permissions"
import { withSuspense } from "~/hocs/withSuspense"
import { useIsUnpublishEnabled } from "~/hooks/useIsUnpublishEnabled"
import { trpc } from "~/utils/trpc"
import { ResourceType, ScheduledAction } from "~prisma/generated/generatedEnums"

import { CancelScheduleUnpublishModal } from "./EditingLockedOverlay/CancelScheduleUnpublishModal"
import { PublishOrUnpublishModal } from "./PublishOrUnpublishModal"
import { CantUnpublishModal } from "./UnpublishModal"

interface PageMoreActionsButtonProps {
  pageId: number
  siteId: number
}

const SuspendablePageMoreActionsButton = ({
  pageId,
  siteId,
}: PageMoreActionsButtonProps): JSX.Element | null => {
  const isUnpublishEnabled = useIsUnpublishEnabled()
  const unpublishModalDisclosure = useDisclosure()
  const cantUnpublishModalDisclosure = useDisclosure()
  const cancelScheduleDisclosure = useDisclosure()

  const [currPage] = trpc.page.readPage.useSuspenseQuery({ pageId, siteId })

  const isLive = currPage.publishedVersionId !== null
  const isScheduledToUnpublish =
    !!currPage.scheduledAt &&
    currPage.scheduledAction === ScheduledAction.Unpublish
  // A null scheduledAction on a legacy row defaults to Publish, matching the
  // convention used throughout the resource/page services.
  const isScheduledToPublish =
    !!currPage.scheduledAt &&
    currPage.scheduledAction !== ScheduledAction.Unpublish
  const isIndexPage = currPage.type === ResourceType.IndexPage

  // Only an IndexPage can be blocked (a Folder/Collection's landing page, when
  // other pages inside are still published) — and only when the button would
  // otherwise be actionable, so this doesn't fire in states that are already
  // disabled for another reason. Reusing the same query the dashboard uses to
  // render this container's LiveStatusBadges means navigating here from the
  // dashboard hits a warm cache instead of paying for a second round-trip.
  const { data: parentIndexPageInfo, isLoading: isBlockInfoLoading } =
    trpc.folder.getIndexpage.useQuery(
      { siteId, resourceId: currPage.parentId ?? "" },
      { enabled: isIndexPage && isLive && !isScheduledToPublish },
    )

  // RootPage can't be unpublished — mirrors the backend's rejection and the
  // dashboard's equivalent exclusion (see RootpageRow.tsx).
  if (!isUnpublishEnabled || currPage.type === ResourceType.RootPage) {
    return null
  }

  const isBlockedByLiveDescendants =
    !!parentIndexPageInfo &&
    parentIndexPageInfo.otherPublishedDescendantCount > 0

  const disabledReason = !isLive
    ? "This page isn't live"
    : isScheduledToPublish
      ? "This page has a scheduled publish. Cancel it before unpublishing."
      : undefined

  return (
    <Can do="unpublish" on="Resource" passThrough>
      {({ isAllowed }) =>
        isAllowed ? (
          <>
            {unpublishModalDisclosure.isOpen && (
              <PublishOrUnpublishModal
                action="unpublish"
                pageId={pageId}
                siteId={siteId}
                hasDraftChanges={currPage.draftBlobId !== null}
                containerType={
                  isIndexPage ? parentIndexPageInfo?.parentType : undefined
                }
                {...unpublishModalDisclosure}
              />
            )}
            {cantUnpublishModalDisclosure.isOpen &&
              currPage.parentId &&
              parentIndexPageInfo && (
                <CantUnpublishModal
                  siteId={siteId}
                  parentId={currPage.parentId}
                  parentType={parentIndexPageInfo.parentType}
                  count={parentIndexPageInfo.otherPublishedDescendantCount}
                  {...cantUnpublishModalDisclosure}
                />
              )}
            {cancelScheduleDisclosure.isOpen && (
              <CancelScheduleUnpublishModal
                pageId={pageId}
                siteId={siteId}
                {...cancelScheduleDisclosure}
              />
            )}
            <Popover placement="bottom-end">
              {({ onClose }) => (
                <>
                  <PopoverTrigger>
                    <IconButton
                      aria-label="More actions"
                      icon={<BiDotsHorizontalRounded />}
                      variant="clear"
                      colorScheme="neutral"
                      size="sm"
                    />
                  </PopoverTrigger>
                  <Portal>
                    <PopoverContent w="fit-content">
                      <PopoverBody>
                        <HStack spacing="1.5rem" py="0.25rem">
                          <VStack align="stretch" spacing="0.125rem">
                            <Text
                              textStyle="subhead-2"
                              color="base.content.strong"
                              whiteSpace="nowrap"
                            >
                              {isScheduledToUnpublish
                                ? "Scheduled to unpublish"
                                : "Unpublish page"}
                            </Text>
                            <Text
                              textStyle="body-2"
                              color="base.content.default"
                              whiteSpace="nowrap"
                            >
                              {isScheduledToUnpublish
                                ? "Cancel the schedule to make changes."
                                : (disabledReason ??
                                  "Hide this page from the public")}
                            </Text>
                          </VStack>
                          {isScheduledToUnpublish ? (
                            <Button
                              variant="outline"
                              colorScheme="critical"
                              size="xs"
                              flexShrink={0}
                              onClick={() => {
                                onClose()
                                cancelScheduleDisclosure.onOpen()
                              }}
                            >
                              Cancel schedule
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="xs"
                              flexShrink={0}
                              isDisabled={
                                !!disabledReason || isBlockInfoLoading
                              }
                              isLoading={isBlockInfoLoading}
                              leftIcon={<Icon as={BiHide} boxSize="1rem" />}
                              onClick={() => {
                                onClose()
                                if (isBlockedByLiveDescendants) {
                                  cantUnpublishModalDisclosure.onOpen()
                                } else {
                                  unpublishModalDisclosure.onOpen()
                                }
                              }}
                            >
                              Unpublish page
                            </Button>
                          )}
                        </HStack>
                      </PopoverBody>
                    </PopoverContent>
                  </Portal>
                </>
              )}
            </Popover>
          </>
        ) : null
      }
    </Can>
  )
}

export const PageMoreActionsButton = withSuspense(
  SuspendablePageMoreActionsButton,
  <Skeleton width="1.75rem" height="1.75rem" />,
)
