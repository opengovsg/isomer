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

  if (!currPage.scheduledAt || !currPage.scheduledAction) {
    return null
  }

  const { verb, actionLabel } = COPY[currPage.scheduledAction]
  const isScheduledToPublish =
    currPage.scheduledAction === ScheduledAction.Publish

  return (
    <Flex
      position="absolute"
      inset={0}
      bg="blackAlpha.700"
      align="center"
      justify="center"
      // Chakra wraps every portaled element (Modal, Toast, Popover, Menu,
      // Tooltip...) in its own `chakra-portal-zIndex` container, hardcoded
      // to z-index 40 — that wrapper establishes a stacking context, so a
      // portaled component's own (much higher) theme z-index only competes
      // within it; as a unit it still sits at 40 against the rest of the
      // page. This overlay must stay below that 40 (not the "overlay"
      // token's 1300) so any modal/toast opened while it's showing — e.g.
      // CancelScheduleModal from the navbar's Cancel-schedule button —
      // still renders on top of it.
      zIndex="docked"
      px="1.5rem"
      py="2rem"
    >
      {/* Mounted only while open. These are plain confirmation dialogs with
          no form/schema to reset, but this still keeps a fresh mutation
          instance per open rather than reusing one whose isPending/error
          state could otherwise linger from the previous open. */}
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
