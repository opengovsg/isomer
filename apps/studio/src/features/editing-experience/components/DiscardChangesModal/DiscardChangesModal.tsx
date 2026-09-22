import type { ModalProps } from "@chakra-ui/react"
import {
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react"
import { Button, ModalCloseButton } from "@opengovsg/design-system-react"

interface DiscardChangesModalProps extends Pick<
  ModalProps,
  "returnFocusOnClose" | "blockScrollOnMount" | "lockFocusAcrossFrames"
> {
  isOpen: boolean
  onClose: () => void
  onDiscard: () => void
}

export const DiscardChangesModal = ({
  isOpen,
  onClose,
  onDiscard,
  ...modalProps
}: DiscardChangesModalProps): JSX.Element => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} {...modalProps}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader pr="4.5rem">
          Are you sure you want to discard your changes?
        </ModalHeader>

        <ModalCloseButton size="lg" />

        <ModalBody>
          <Text textStyle="body-2">All edits will be lost.</Text>
        </ModalBody>

        <ModalFooter>
          <HStack spacing="1rem">
            <Button variant="clear" colorScheme="neutral" onClick={onClose}>
              Go back to editing
            </Button>
            <Button variant="solid" colorScheme="critical" onClick={onDiscard}>
              Yes, discard changes
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
