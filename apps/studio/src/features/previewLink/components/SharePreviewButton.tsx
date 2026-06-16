import { IconButton, useDisclosure } from "@chakra-ui/react"
import { TouchableTooltip } from "@opengovsg/design-system-react"
import { BiShareAlt } from "react-icons/bi"

import { SharePreviewModal } from "./SharePreviewModal"

interface SharePreviewButtonProps {
  siteId: number
  resourceId: number
}

export const SharePreviewButton = ({
  siteId,
  resourceId,
}: SharePreviewButtonProps): JSX.Element => {
  const disclosure = useDisclosure()

  return (
    <>
      <TouchableTooltip label="Share preview" placement="bottom">
        <IconButton
          aria-label="Share preview"
          icon={<BiShareAlt />}
          variant="ghost"
          size="sm"
          onClick={disclosure.onOpen}
        />
      </TouchableTooltip>
      <SharePreviewModal
        isOpen={disclosure.isOpen}
        onClose={disclosure.onClose}
        siteId={siteId}
        resourceId={resourceId}
      />
    </>
  )
}
