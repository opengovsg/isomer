import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"

interface DiscardCarouselSlidesModalProps {
  isOpen: boolean
  slideCount: number
  onClose: () => void
  onConfirm: () => void
}

export function DiscardCarouselSlidesModal({
  isOpen,
  slideCount,
  onClose,
  onConfirm,
}: DiscardCarouselSlidesModalProps) {
  const discardedCount = slideCount - 1

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">Discard extra carousel slides?</ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody>
          Only the first slide will be kept. The other {discardedCount}{" "}
          {discardedCount === 1 ? "slide" : "slides"} will be removed.
        </ModalBody>
        <ModalFooter>
          <Button
            textColor="base.content.strong"
            colorScheme="neutral"
            variant="clear"
            size="sm"
            mr="0.25rem"
            onClick={onClose}
          >
            Keep carousel
          </Button>
          <Button colorScheme="critical" size="sm" onClick={onConfirm}>
            Yes, change style
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
