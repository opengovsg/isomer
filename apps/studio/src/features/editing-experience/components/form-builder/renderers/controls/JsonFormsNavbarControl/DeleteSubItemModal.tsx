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

interface DeleteSubItemModalProps {
  label: string
  isOpen: boolean
  onClose: () => void
  onDelete: () => void
}

export const DeleteSubItemModal = ({
  label,
  isOpen,
  onClose,
  onDelete,
}: DeleteSubItemModalProps): JSX.Element => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">Delete “{label}”?</ModalHeader>

        <ModalCloseButton size="lg" />

        <ModalBody>
          {/* NOTE: We  */}
          <Text textStyle="body-1">
            You’re about to delete 1 link from the navigation menu. This doesn’t
            remove any actual pages.
          </Text>
        </ModalBody>

        <ModalFooter>
          <HStack spacing="1rem">
            <Button variant="clear" colorScheme="neutral" onClick={onClose}>
              No, don’t delete
            </Button>
            <Button variant="solid" colorScheme="critical" onClick={onDelete}>
              Delete link
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
