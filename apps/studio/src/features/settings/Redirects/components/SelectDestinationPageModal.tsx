import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react"
import { Button, ModalCloseButton } from "@opengovsg/design-system-react"
import { useRef, useState } from "react"
import { ResourceSelector } from "~/components/ResourceSelector"
import {
  hasNonEmptyString,
  isDefinedNumber,
  isNullableBooleanTrue,
  isNonEmptyArray,
} from "~/utils/truthiness"

interface SelectDestinationPageModalProps {
  isOpen: boolean
  siteId: number
  onClose: () => void
  // Receives the selected page's current full permalink. The redirect stores
  // this as a reference server-side, so the permalink is only what we show.
  onSelect: (permalink: string) => void
}

export const SelectDestinationPageModal = ({
  isOpen,
  siteId,
  onClose,
  onSelect,
}: SelectDestinationPageModalProps): React.ReactNode => {
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(
    null,
  )
  // ResourceSelector already builds the selected resource's full permalink, so
  // we read it straight off onChange instead of re-fetching it on confirm.
  const selectedPermalinkRef = useRef("")

  const handleClose = () => {
    setSelectedResourceId(null)
    selectedPermalinkRef.current = ""
    onClose()
  }

  const handleConfirm = () => {
    if (!hasNonEmptyString(selectedResourceId)) {
      return
    }
    // ResourceSelector's permalink has no leading slash; destinations are stored
    // as rooted paths, and conversion to a reference happens on save.
    onSelect(`/${selectedPermalinkRef.current}`)
    handleClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">Redirect to a page on your site</ModalHeader>
        <ModalCloseButton size="lg" />

        <ModalBody>
          <Text textStyle="subhead-1" mb="0.75rem">
            Redirect to...
          </Text>

          <ResourceSelector
            interactionType="link"
            siteId={siteId}
            onChange={(resourceId, fullPermalink) => {
              setSelectedResourceId(resourceId)
              selectedPermalinkRef.current = fullPermalink
            }}
            selectedResourceId={selectedResourceId ?? undefined}
          />
        </ModalBody>

        <ModalFooter>
          <Button
            isDisabled={!hasNonEmptyString(selectedResourceId)}
            onClick={handleConfirm}
          >
            Redirect here
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
