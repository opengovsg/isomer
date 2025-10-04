import { Button, HStack, Icon, Text, useDisclosure } from "@chakra-ui/react"
import { TouchableTooltip } from "@opengovsg/design-system-react"
import { BiTimeFive } from "react-icons/bi"

import { CancelScheduleModal } from "."
import { formatScheduledAtDate } from "./utils"

interface CancelSchedulePublishIndicatorProps {
  pageId: number
  siteId: number
  scheduledAt: Date
}

export const CancelSchedulePublishIndicator = ({
  pageId,
  siteId,
  scheduledAt,
}: CancelSchedulePublishIndicatorProps) => {
  const cancelScheduleDisclosure = useDisclosure()
  return (
    <>
      {cancelScheduleDisclosure.isOpen && (
        <CancelScheduleModal
          {...cancelScheduleDisclosure}
          siteId={siteId}
          pageId={pageId}
        />
      )}
      <HStack alignItems="center" spacing="1rem">
        <TouchableTooltip label="This page is scheduled to publish. To make changes, cancel the schedule or wait until the page is published.">
          <HStack spacing="0.25rem">
            <Icon as={BiTimeFive} boxSize="1rem" />
            <Text textStyle="caption-1">
              {formatScheduledAtDate(scheduledAt)}
            </Text>
          </HStack>
        </TouchableTooltip>
        <Button
          colorScheme="critical"
          onClick={cancelScheduleDisclosure.onOpen}
        >
          Cancel schedule
        </Button>
      </HStack>
    </>
  )
}
