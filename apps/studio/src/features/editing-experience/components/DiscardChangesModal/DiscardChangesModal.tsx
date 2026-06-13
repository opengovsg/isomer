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
import { ModalCloseButton } from "@opengovsg/design-system-react"
import { Button } from "@opengovsg/oui"

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
        <ModalHeader pr="4.5rem">
          Are you sure you want to discard your changes?
        </ModalHeader>

        <ModalCloseButton size="lg" />

        <ModalBody>
          <Text textStyle="body-2">All edits will be lost.</Text>
        </ModalBody>

        <ModalFooter>
          <HStack spacing="1rem">
            <Button variant="clear" color="neutral" onPress={onClose}>
              Go back to editing
            </Button>
            <Button variant="solid" color="critical" onPress={onDiscard}>
              Yes, discard changes
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
