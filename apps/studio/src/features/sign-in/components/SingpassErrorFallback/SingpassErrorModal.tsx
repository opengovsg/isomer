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
  redirectUrl: string
}

export const SingpassErrorModal = ({
  redirectUrl,
}: SingpassErrorModalProps) => {
  const { onClose } = useDisclosure()
  const modalSize = useBreakpointValue({
    base: "mobile",
    md: "md",
  })

  const backToLoginLink = useMemo(() => {
    return appendWithRedirect(SIGN_IN, redirectUrl)
  }, [redirectUrl])

  return (
    <Modal isOpen onClose={onClose} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>An unknown error has occurred</ModalHeader>
        <ModalBody>Please try logging in again.</ModalBody>
        <ModalFooter>
          <Button as={Link} href={backToLoginLink}>
            Back to login
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
