import { useMemo } from "react"
import Link from "next/link"
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useBreakpointValue,
  useDisclosure,
} from "@chakra-ui/react"

import { SIGN_IN } from "~/lib/routes"
import { appendWithRedirect } from "~/utils/url"

interface SingpassErrorModalProps {
  message: string
  redirectUrl: string
}

export const SingpassErrorModal = ({
  message,
  redirectUrl,
}: SingpassErrorModalProps) => {
  const { onClose } = useDisclosure()
  const modalSize = useBreakpointValue({
    base: "mobile",
    md: "md",
  })

  const modalText = useMemo(() => {
    switch (message) {
      default:
        return {
          header: "An unknown error has occurred",
          body: "Please try logging in again.",
        }
    }
  }, [message])

  const backToLoginLink = useMemo(() => {
    return appendWithRedirect(SIGN_IN, redirectUrl)
  }, [redirectUrl])

  return (
    <Modal isOpen onClose={onClose} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{modalText.header}</ModalHeader>
        <ModalBody>{modalText.body}</ModalBody>
        <ModalFooter>
          <Button as={Link} href={backToLoginLink}>
            Back to login
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
