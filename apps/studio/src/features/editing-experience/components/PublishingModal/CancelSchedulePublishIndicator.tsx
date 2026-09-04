import { Button, useDisclosure } from "@chakra-ui/react"

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
          action="publish"
          siteId={siteId}
          pageId={pageId}
        />
      )}
      <Button colorScheme="critical" onClick={cancelScheduleDisclosure.onOpen}>
        Cancel schedule
      </Button>
    </>
  )
}
