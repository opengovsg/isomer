import { Button, useDisclosure } from "@chakra-ui/react"
import { TouchableTooltip } from "@opengovsg/design-system-react"

import { CancelScheduleModal } from "."

interface CancelSchedulePublishIndicatorProps {
  pageId: number
  siteId: number
  isCurrentlyPublished: boolean
}

export const CancelSchedulePublishIndicator = ({
  pageId,
  siteId,
  isCurrentlyPublished,
}: CancelSchedulePublishIndicatorProps) => {
  const cancelScheduleDisclosure = useDisclosure()
  return (
    <>
      {cancelScheduleDisclosure.isOpen && (
        <CancelScheduleModal
          {...cancelScheduleDisclosure}
          action="publish"
          siteId={siteId}
          pageId={pageId}
          isCurrentlyPublished={isCurrentlyPublished}
        />
      )}
      <TouchableTooltip label="This page is scheduled to publish. To make changes, cancel the schedule or wait until the page is published.">
        <Button onClick={cancelScheduleDisclosure.onOpen}>
          Cancel schedule
        </Button>
      </TouchableTooltip>
    </>
  )
}
