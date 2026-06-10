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

import type { RedirectRow } from "../types"

interface DeleteRedirectModalProps {
  redirect: RedirectRow | null
  isPending: boolean
  onClose: () => void
  onDelete: (redirect: RedirectRow) => void
}

export const DeleteRedirectModal = ({
  redirect,
  isPending,
  onClose,
  onDelete,
}: DeleteRedirectModalProps): JSX.Element => {
  return (
    <Modal isOpen={redirect !== null} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">
          Are you sure you want to delete this redirect?
        </ModalHeader>

        <ModalCloseButton size="lg" />

        <ModalBody>
          <Text textStyle="body-1">
            Visitors to {redirect?.source} will no longer be redirected. This
            change will be published to your site immediately.
          </Text>
        </ModalBody>

        <ModalFooter>
          <HStack spacing="1rem">
            <Button variant="clear" colorScheme="neutral" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="solid"
              colorScheme="critical"
              isLoading={isPending}
              onClick={() => redirect && onDelete(redirect)}
            >
              Yes, delete
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
