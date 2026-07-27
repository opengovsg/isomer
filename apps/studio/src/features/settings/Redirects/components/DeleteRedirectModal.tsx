import {
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from "@chakra-ui/react"
import { Button, ModalCloseButton } from "@opengovsg/design-system-react"

import type { RedirectRow } from "../types"

interface DeleteRedirectModalProps {
  redirect: RedirectRow | null
  // Display label for the destination — a reference is resolved to the page's
  // permalink upstream so the modal never leaks the raw "[resource:...]" string
  destinationLabel: string
  isPending: boolean
  onClose: () => void
  onDelete: (redirect: RedirectRow) => void
}

export const DeleteRedirectModal = ({
  redirect,
  destinationLabel,
  isPending,
  onClose,
  onDelete,
}: DeleteRedirectModalProps): JSX.Element => {
  return (
    <Modal isOpen={redirect !== null} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">Delete redirect?</ModalHeader>

        <ModalCloseButton size="lg" />

        <ModalBody>
          <Stack spacing="1.5rem">
            <Text textStyle="body-1">
              This will permanently delete the redirect.
            </Text>
            <HStack
              spacing="1.5rem"
              align="flex-start"
              bgColor="base.canvas.alt"
              borderRadius="0.25rem"
              p="0.75rem"
            >
              <Stack spacing="0.25rem" flex={1} minW={0}>
                <Text textStyle="subhead-2" color="base.content.strong">
                  When someone visits
                </Text>
                <Text
                  textStyle="body-2"
                  color="base.content.default"
                  wordBreak="break-all"
                >
                  {redirect?.source}
                </Text>
              </Stack>
              <Stack spacing="0.25rem" flex={1} minW={0}>
                <Text textStyle="subhead-2" color="base.content.strong">
                  Redirect them to
                </Text>
                <Text
                  textStyle="body-2"
                  color="base.content.default"
                  wordBreak="break-all"
                >
                  {destinationLabel}
                </Text>
              </Stack>
            </HStack>
          </Stack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing="1rem">
            <Button variant="clear" colorScheme="neutral" onClick={onClose}>
              No, keep redirect
            </Button>
            <Button
              variant="solid"
              colorScheme="critical"
              isLoading={isPending}
              onClick={() => redirect && onDelete(redirect)}
            >
              Delete redirect
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
