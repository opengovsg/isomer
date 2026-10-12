import { Button, useDisclosure } from "@chakra-ui/react"

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
      <Button onClick={cancelScheduleDisclosure.onOpen}>Cancel schedule</Button>
    </>
  )
}
