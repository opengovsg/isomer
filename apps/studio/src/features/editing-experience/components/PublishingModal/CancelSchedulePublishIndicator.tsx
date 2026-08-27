import { Button, useDisclosure } from "@chakra-ui/react"
import { TouchableTooltip } from "@opengovsg/design-system-react"

import { CancelScheduleModal } from "."

interface CancelSchedulePublishIndicatorProps {
  pageId: number
  siteId: number
}

export const CancelSchedulePublishIndicator = ({
  pageId,
  siteId,
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
      <TouchableTooltip label="This page is scheduled to publish. To make changes, cancel the schedule or wait until the page is published.">
        <Button
          colorScheme="critical"
          onClick={cancelScheduleDisclosure.onOpen}
        >
          Cancel schedule
        </Button>
      </TouchableTooltip>
    </>
  )
}
