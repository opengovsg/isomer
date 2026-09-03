import {
  Center,
  Flex,
  Icon,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { BiLockAlt } from "react-icons/bi"
import { CancelScheduleModal } from "~/features/editing-experience/components/PublishingModal"
import { withSuspense } from "~/hocs/withSuspense"
import { trpc } from "~/utils/trpc"
import { ScheduledAction } from "~prisma/generated/generatedEnums"

import { PublishOrUnpublishNowModal } from "./PublishOrUnpublishNowModal"

interface EditingLockedOverlayProps {
  pageId: number
  siteId: number
}

const COPY: Record<ScheduledAction, { verb: string; actionLabel: string }> = {
  [ScheduledAction.Publish]: { verb: "publishes", actionLabel: "Publish now" },
  [ScheduledAction.Unpublish]: {
    verb: "unpublishes",
    actionLabel: "Unpublish now",
  },
}

const SuspendableEditingLockedOverlay = ({
  pageId,
  siteId,
}: EditingLockedOverlayProps): JSX.Element | null => {
  const [currPage] = trpc.page.readPage.useSuspenseQuery({ pageId, siteId })
  const actionDisclosure = useDisclosure()
  const cancelScheduleDisclosure = useDisclosure()

  if (!currPage.scheduledAt) {
    return null
  }

  // A null scheduledAction on a legacy row defaults to Publish, matching
  // PublishButton/PageMoreActionsButton.
  const scheduledAction = currPage.scheduledAction ?? ScheduledAction.Publish
  const { verb, actionLabel } = COPY[scheduledAction]
  const isScheduledToPublish = scheduledAction === ScheduledAction.Publish

  return (
    <Flex
      position="absolute"
      inset={0}
      bg="blackAlpha.700"
      align="center"
      justify="center"
      // Must stay below Chakra's portal wrapper z-index (hardcoded 40, not
      // the "overlay" token's 1300) so modals/toasts opened over this
      // overlay still render above it.
      zIndex="docked"
      px="1.5rem"
      py="2rem"
    >
      {/* Mounted only while open, so each open gets a fresh mutation instance
          instead of one with stale isPending/error state. */}
      {actionDisclosure.isOpen && (
        <PublishOrUnpublishNowModal
          action={isScheduledToPublish ? "publish" : "unpublish"}
          pageId={pageId}
          siteId={siteId}
          {...actionDisclosure}
        />
      )}
      {cancelScheduleDisclosure.isOpen && (
        <CancelScheduleModal
          action={isScheduledToPublish ? "publish" : "unpublish"}
          pageId={pageId}
          siteId={siteId}
          {...cancelScheduleDisclosure}
        />
      )}
      <VStack spacing="1.5rem" maxW="22.5rem" textAlign="center">
        <VStack spacing="0.5rem">
          <Center
            boxSize="2.875rem"
            borderRadius="full"
            bg="whiteAlpha.300"
            mb="0.5rem"
          >
            <Icon as={BiLockAlt} boxSize="1.5rem" color="white" />
          </Center>
          <Text textStyle="subhead-1" color="white">
            This page is locked for editing until it {verb}
          </Text>
          <Text textStyle="caption-2" color="white">
            {actionLabel}, cancel the schedule to edit, or wait until the
            scheduled time.
          </Text>
        </VStack>
        <Flex gap="0.75rem">
          <Button variant="reverse" onClick={actionDisclosure.onOpen}>
            {actionLabel}
          </Button>
          <Button onClick={cancelScheduleDisclosure.onOpen}>
            Cancel schedule
          </Button>
        </Flex>
      </VStack>
    </Flex>
  )
}

export const EditingLockedOverlay = withSuspense(
  SuspendableEditingLockedOverlay,
  null,
)
