import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  VStack,
} from "@chakra-ui/react"

interface EditProfileModalProps {
  isOnboarded: boolean
  isOpen: boolean
  onClose: () => void
}

export const EditProfileModal = ({
  isOnboarded,
  isOpen,
  onClose,
}: EditProfileModalProps) => {
  const onSaveChanges = () => {
    console.log("TODO: Save changes")
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay>
        <ModalContent>
          {isOnboarded ? (
            <>
              <ModalHeader mr="3.5rem">Edit profile</ModalHeader>
              <ModalCloseButton size="lg" />
            </>
          ) : (
            <ModalHeader mr="3.5rem">
              Welcome to Studio! Tell us about yourself.
            </ModalHeader>
          )}
          <ModalBody>
            <VStack gap="1rem"></VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="solid" onClick={onSaveChanges}>
              Save changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  )
}
