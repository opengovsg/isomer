import { useRouter } from "next/router"
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
      <ModalContent size="lg" overflow="hidden">
        <ModalHeader>Leave this page without saving your settings?</ModalHeader>
        <ModalCloseButton />
        <ModalBody>All edits will be lost.</ModalBody>
        <ModalFooter>
          <Button
            textColor="base.content.strong"
            colorScheme="neutral"
            variant="clear"
            size="sm"
            onClick={onClose}
            mr="0.25rem"
          >
            Go back to editing
          </Button>
          <Button
            colorScheme="critical"
            size="sm"
            onClick={() => {
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
