import {
  Button,
  FormControl,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  VStack,
} from "@chakra-ui/react"
import { FormLabel, PhoneNumberInput } from "@opengovsg/design-system-react"

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
            <VStack gap="1rem" width="100%">
              <FormControl isRequired>
                <FormLabel description="Used to address you on support channels">
                  Your full name
                </FormLabel>
                <Input
                  noOfLines={1}
                  maxLength={256} // arbitrary limit
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel description="Used for two-factor authentication (2FA). Make sure it is accurate">
                  Your phone number
                </FormLabel>
                <PhoneNumberInput
                  allowInternational={false}
                  defaultCountry="SG"
                />
              </FormControl>
            </VStack>
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
