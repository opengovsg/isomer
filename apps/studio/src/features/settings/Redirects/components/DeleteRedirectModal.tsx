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
        <ModalHeader mr="3.5rem">Delete redirect?</ModalHeader>

        <ModalCloseButton size="lg" />

        <ModalBody>
          <Stack spacing="1.5rem">
            <Text textStyle="body-1">
              Are you sure you want to delete this redirect?
            </Text>
            <HStack
              spacing="1.5rem"
              align="top"
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
                  {redirect?.destination}
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
