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

interface DeleteBlockModalProps {
  itemName: string
  isOpen: boolean
  onClose: () => void
  onDelete: () => void
}

export const DeleteBlockModal = ({
  itemName,
  isOpen,
  onClose,
  onDelete,
}: DeleteBlockModalProps): JSX.Element => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">
          Are you sure you want to delete {itemName}?
        </ModalHeader>

        <ModalCloseButton size="lg" />

        <ModalBody>
          <Text textStyle="body-1">This cannot be undone.</Text>
        </ModalBody>

        <ModalFooter>
          <HStack spacing="1rem">
            <Button variant="clear" colorScheme="neutral" onClick={onClose}>
              Go back to editing
            </Button>
            <Button variant="solid" colorScheme="critical" onClick={onDelete}>
              Yes, delete
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
