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

interface ConfirmConvertIndexPageModalProps {
  isOpen: boolean
  onClose: () => void
  onProceed: () => void
}

export const ConfirmConvertIndexPageModal = ({
  isOpen,
  onClose,
  onProceed,
}: ConfirmConvertIndexPageModalProps): JSX.Element => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader pr="4.5rem">
          Are you sure you want to accept these changes?
        </ModalHeader>

        <ModalCloseButton size="lg" />

        <ModalBody>
          <Text textStyle="body-2">All your custom content will be lost.</Text>
        </ModalBody>

        <ModalFooter>
          <HStack spacing="1rem">
            <Button variant="clear" colorScheme="neutral" onClick={onClose}>
              No, cancel
            </Button>
            <Button variant="solid" onClick={onProceed}>
              Accept changes
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
