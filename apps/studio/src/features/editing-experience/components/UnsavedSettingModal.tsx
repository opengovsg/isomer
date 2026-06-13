import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react"
import { Button } from "@opengovsg/oui"
import { useRouter } from "next/router"

interface UnsavedSettingModalProps {
  isOpen: boolean
  onClose: () => void
  nextUrl: string
}

export const UnsavedSettingModal = ({
  isOpen,
  onClose,
  nextUrl: nextURL,
}: UnsavedSettingModalProps): JSX.Element => {
  const router = useRouter()
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent overflow="hidden">
        <ModalHeader mr="3.5rem">
          Leave this page without saving your settings?
        </ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody>All edits will be lost.</ModalBody>
        <ModalFooter>
          <Button
            color="neutral"
            variant="clear"
            size="sm"
            onPress={onClose}
            className="mr-1"
          >
            Go back to editing
          </Button>
          <Button
            color="critical"
            size="sm"
            onPress={() => {
              void router.push(nextURL)
            }}
          >
            Yes, leave this page
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
