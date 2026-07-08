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
import { useState } from "react"
import { ResourceSelector } from "~/components/ResourceSelector"

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
}: SelectDestinationPageModalProps): JSX.Element => {
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(
    null,
  )
  // ResourceSelector already builds the selected resource's full permalink, so
  // we read it straight off onChange instead of re-fetching it on confirm.
  const [selectedPermalink, setSelectedPermalink] = useState("")

  const handleClose = () => {
    setSelectedResourceId(null)
    setSelectedPermalink("")
    onClose()
  }

  const handleConfirm = () => {
    if (!selectedResourceId) return
    // ResourceSelector's permalink has no leading slash; destinations are stored
    // as rooted paths, and conversion to a reference happens on save.
    onSelect(`/${selectedPermalink}`)
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
              setSelectedPermalink(fullPermalink)
            }}
            selectedResourceId={selectedResourceId ?? undefined}
          />
        </ModalBody>

        <ModalFooter>
          <Button isDisabled={!selectedResourceId} onClick={handleConfirm}>
            Redirect here
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
