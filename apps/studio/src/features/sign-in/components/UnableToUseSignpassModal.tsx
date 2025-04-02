import NextLink from "next/link"
import {
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react"

interface UnableToUseSignpassModalProps {
  isOpen: boolean
  onClose: () => void
}

export const UnableToUseSignpassModal = ({
  isOpen,
  onClose,
}: UnableToUseSignpassModalProps): JSX.Element => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />

      <ModalContent>
        <ModalHeader mr="3.5rem">
          Can’t use Singpass to authenticate?
        </ModalHeader>

        <ModalCloseButton size="lg" />

        <ModalBody>
          <Text>
            You can only access Isomer Studio with Singpass. If you need to
            access Isomer Studio urgently, ask your colleagues to help you.
            <br />
            <br />
            For any issues with Singpass, you may refer to{" "}
            <Link
              as={NextLink}
              href="https://ask.gov.sg/singpass"
              target="_blank"
            >
              Singpass FAQs
            </Link>
            .
          </Text>
        </ModalBody>

        <ModalFooter />
      </ModalContent>
    </Modal>
  )
}
