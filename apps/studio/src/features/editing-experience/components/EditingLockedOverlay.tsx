import { Center, Flex, Icon, Text, VStack } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { BiLockAlt } from "react-icons/bi"
import { withSuspense } from "~/hocs/withSuspense"
import { trpc } from "~/utils/trpc"
import { ScheduledAction } from "~prisma/generated/generatedEnums"

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

  if (!currPage.scheduledAt || !currPage.scheduledAction) {
    return null
  }

  const { verb, actionLabel } = COPY[currPage.scheduledAction]

  return (
    <Flex
      position="absolute"
      inset={0}
      bg="blackAlpha.700"
      align="center"
      justify="center"
      zIndex="overlay"
      px="1.5rem"
      py="2rem"
    >
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
          {/* Placeholder actions — modals to be wired in a follow-up */}
          <Button variant="outline" bg="white" color="interaction.main.default">
            {actionLabel}
          </Button>
          <Button>Cancel schedule</Button>
        </Flex>
      </VStack>
    </Flex>
  )
}

export const EditingLockedOverlay = withSuspense(
  SuspendableEditingLockedOverlay,
  null,
)
