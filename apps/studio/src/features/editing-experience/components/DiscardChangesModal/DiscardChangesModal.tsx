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

interface DiscardChangesModalProps {
  isOpen: boolean
  onClose: () => void
  onDiscard: () => void
}

export const DiscardChangesModal = ({
  isOpen,
  onClose,
  onDiscard,
}: DiscardChangesModalProps): JSX.Element => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader maxW="90%">
          Are you sure you want to discard your changes?
        </ModalHeader>

        <ModalCloseButton />

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
