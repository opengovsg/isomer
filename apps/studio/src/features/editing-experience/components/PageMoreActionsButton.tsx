import {
  Divider,
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
import { useRouter } from "next/router"
import posthog from "posthog-js"
import { BiDotsHorizontalRounded, BiHide, BiHistory } from "react-icons/bi"
import { Can } from "~/features/permissions"
import { withSuspense } from "~/hocs/withSuspense"
import { trpc } from "~/utils/trpc"
import { ResourceType, ScheduledAction } from "~prisma/generated/generatedEnums"

import { CancelScheduleModal } from "./PublishingModal"
import { PublishOrUnpublishModal } from "./PublishOrUnpublishModal"

interface PageMoreActionsButtonProps {
  pageId: number
  siteId: number
}

const SuspendablePageMoreActionsButton = ({
  pageId,
  siteId,
}: PageMoreActionsButtonProps): JSX.Element | null => {
  const router = useRouter()
  const unpublishModalDisclosure = useDisclosure()
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

  // Shares the query the dashboard (and PageStatusIndicators) uses for
  // LiveStatusBadges, so navigating here reuses a warm cache instead of a
  // second round-trip.
  const {
    data: parentIndexPageInfo,
    isLoading: isBlockInfoLoading,
    isError: isBlockInfoError,
  } = trpc.folder.getIndexpage.useQuery(
    { siteId, resourceId: currPage.parentId ?? "" },
    { enabled: isIndexPage },
  )
  // Fail closed: while we don't yet know (or failed to find out) whether a
  // live descendant blocks unpublishing, don't let the button fall through
  // to an unblocked state — `!!parentIndexPageInfo` alone would silently
  // read as "nothing blocks this" on error.
  const isBlockInfoPending =
    isIndexPage && (isBlockInfoLoading || isBlockInfoError)

  // RootPage can't be unpublished — mirrors the backend's rejection and the
  // dashboard's equivalent exclusion (see RootpageRow.tsx). Shown disabled
  // with a reason rather than hidden, so the action is discoverable.
  const isRootPage = currPage.type === ResourceType.RootPage
  // History is independent of unpublishing availability and permissions.
  const showHistory = currPage.type !== ResourceType.CollectionLink

  // isIndexPage must gate both of these explicitly, not just the query's
  // `enabled`. Every child page in a folder shares the same query key as
  // the folder's own index page (both key off `currPage.parentId`), so
  // `enabled: false` alone doesn't stop a child page from reading back
  // cached block-info left over from a prior visit to the index page (or the
  // dashboard).
  //
  // Two different questions with two different answers:
  // - isBlockedFromUnpublishingNow: is anything live right now. Blocks
  //   "Unpublish now" (which has no grace period).
  // - isBlockedFromScheduling: would some descendant block this forever,
  //   regardless of what date is picked (live with no unpublish scheduled at
  //   all). Blocks the "Unpublish later" flow entirely. A descendant that's
  //   merely live-but-already-scheduled-to-unpublish blocks the first but
  //   not the second.
  const isBlockedFromUnpublishingNow =
    isIndexPage &&
    !!parentIndexPageInfo &&
    parentIndexPageInfo.otherPublishedDescendantCount > 0
  const isBlockedFromScheduling =
    isIndexPage &&
    !!parentIndexPageInfo &&
    parentIndexPageInfo.unschedulableDescendantCount > 0

  // Ordered by priority — first match wins, and drives both the popover
  // title and (via disabledReason) whether the button is disabled.
  // isBlockedFromScheduling takes priority over !isLive: an IndexPage can
  // read "not live" on its own while its container-aware badge still shows
  // Live (because a descendant is), so leading with "isn't live" would
  // contradict what the user just saw. Live descendants are the actionable
  // blocker in that case.
  let title = "Unpublish page"
  let disabledReason: string | undefined
  if (isRootPage) {
    title = "This page can't be unpublished"
    disabledReason = "The homepage can't be unpublished."
  } else if (isBlockedFromScheduling) {
    title = "This page can't be unpublished"
    disabledReason = "There are child pages that are or will be live"
  } else if (!isLive) {
    disabledReason = "This page isn't live"
  } else if (isScheduledToPublish) {
    disabledReason =
      "This page has a scheduled publish. Cancel it before unpublishing."
  }

  // "Cancel schedule" has no disabled condition of its own, so the trigger
  // reads as active whenever that's the action on offer. Otherwise it
  // mirrors the "Unpublish page" button's own isDisabled condition below.
  const isPrimaryActionAvailable =
    isScheduledToUnpublish || (!disabledReason && !isBlockInfoPending)

  return (
    <Can do="unpublish" on="Resource" passThrough>
      {({ isAllowed }) => (
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
              disableNow={isBlockedFromUnpublishingNow}
              {...unpublishModalDisclosure}
            />
          )}
          {cancelScheduleDisclosure.isOpen && (
            <CancelScheduleModal
              action="unpublish"
              pageId={pageId}
              siteId={siteId}
              {...cancelScheduleDisclosure}
            />
          )}
          <Popover
            placement="bottom-end"
            onOpen={() =>
              posthog.capture("unpublish_more_actions_opened", {
                site_id: siteId,
              })
            }
          >
            {({ onClose }) => (
              <>
                <PopoverTrigger>
                  <IconButton
                    aria-label="More actions"
                    icon={<BiDotsHorizontalRounded />}
                    variant="outline"
                    colorScheme={
                      showHistory || (isAllowed && isPrimaryActionAvailable)
                        ? "main"
                        : "neutral"
                    }
                    // Stays clickable either way (the popover explains why
                    // when blocked), so we can't rely on isDisabled for the
                    // grayed-out look — match its colours by hand instead.
                    sx={
                      showHistory || (isAllowed && isPrimaryActionAvailable)
                        ? undefined
                        : {
                            borderColor: "interaction.support.disabled-content",
                            color: "interaction.support.disabled-content",
                          }
                    }
                    size="sm"
                  />
                </PopoverTrigger>
                <Portal>
                  <PopoverContent w="fit-content">
                    <PopoverBody>
                      <VStack
                        align="stretch"
                        spacing="1.5rem"
                        py="1rem"
                        px="0.75rem"
                      >
                        <HStack
                          justify="space-between"
                          spacing="1.5rem"
                          py="0.25rem"
                        >
                          <VStack align="stretch" spacing="0.125rem">
                            <Text
                              textStyle="subhead-2"
                              fontWeight={600}
                              color="base.content.strong"
                              whiteSpace="nowrap"
                            >
                              {isScheduledToUnpublish
                                ? "Scheduled to unpublish"
                                : title}
                            </Text>
                            <Text
                              textStyle="body-2"
                              color="base.content.default"
                              whiteSpace="nowrap"
                            >
                              {isScheduledToUnpublish
                                ? "Cancel the schedule to make changes."
                                : !isAllowed
                                  ? "You need to be a Publisher or Admin to unpublish."
                                  : (disabledReason ??
                                    "Hide this page from the public.")}
                            </Text>
                          </VStack>
                          {isScheduledToUnpublish ? (
                            <Button
                              variant="outline"
                              colorScheme="critical"
                              isDisabled={!isAllowed}
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
                                !isAllowed ||
                                !!disabledReason ||
                                isBlockInfoPending
                              }
                              isLoading={isBlockInfoLoading}
                              leftIcon={<Icon as={BiHide} boxSize="1rem" />}
                              onClick={() => {
                                posthog.capture("unpublish_modal_opened", {
                                  site_id: siteId,
                                })
                                onClose()
                                unpublishModalDisclosure.onOpen()
                              }}
                            >
                              Unpublish page
                            </Button>
                          )}
                        </HStack>
                        {showHistory && <Divider />}
                        {showHistory && (
                          <HStack
                            spacing="1.5rem"
                            py="0.25rem"
                            justify="space-between"
                          >
                            <VStack align="stretch" spacing="0.125rem">
                              <Text
                                textStyle="subhead-2"
                                fontWeight={600}
                                color="base.content.strong"
                                whiteSpace="nowrap"
                              >
                                Page history
                              </Text>
                              <Text
                                textStyle="body-2"
                                color="base.content.default"
                                whiteSpace="nowrap"
                              >
                                View previously published versions of this page.
                              </Text>
                            </VStack>
                            <Button
                              variant="outline"
                              size="xs"
                              flexShrink={0}
                              leftIcon={<Icon as={BiHistory} boxSize="1rem" />}
                              onClick={() => {
                                onClose()
                                void router.push(
                                  {
                                    pathname: `/sites/${siteId}/pages/${pageId}`,
                                    query: { history: "true" },
                                  },
                                  undefined,
                                  {
                                    shallow:
                                      router.pathname ===
                                      "/sites/[siteId]/pages/[pageId]",
                                  },
                                )
                              }}
                            >
                              View history
                            </Button>
                          </HStack>
                        )}
                      </VStack>
                    </PopoverBody>
                  </PopoverContent>
                </Portal>
              </>
            )}
          </Popover>
        </>
      )}
    </Can>
  )
}

export const PageMoreActionsButton = withSuspense(
  SuspendablePageMoreActionsButton,
  <Skeleton width="1.75rem" height="1.75rem" />,
)
