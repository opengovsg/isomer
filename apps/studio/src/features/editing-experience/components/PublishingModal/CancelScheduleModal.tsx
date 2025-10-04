import type { UseDisclosureReturn } from "@chakra-ui/react"
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react"
import { useToast } from "@opengovsg/design-system-react"

import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { trpc } from "~/utils/trpc"

interface CancelScheduleModalProps extends UseDisclosureReturn {
  pageId: number
  siteId: number
}

export const CancelScheduleModal = ({
  pageId,
  siteId,
  onClose,
  ...rest
}: CancelScheduleModalProps): JSX.Element => {
  const utils = trpc.useUtils()
  const toast = useToast()
  const { mutate, isPending } = trpc.page.cancelSchedulePage.useMutation({
    onSettled: async () => {
      await utils.page.readPage.refetch({ pageId, siteId })
      onClose()
    },
    onSuccess: () => {
      toast({
        status: "success",
        title: "Schedule cancelled successfully",
        ...BRIEF_TOAST_SETTINGS,
      })
    },
    onError: (error) => {
      console.error(`Error occurred when cancelling schedule: ${error.message}`)
      toast({
        status: "error",
        title: "Failed to cancel schedule. Please contact Isomer support.",
        ...BRIEF_TOAST_SETTINGS,
      })
    },
  })
  return (
    <Modal onClose={onClose} {...rest}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">
          Are you sure you want to cancel the schedule to publish?
        </ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody>
          <Text textStyle="body-2">This page will go back to draft mode.</Text>
        </ModalBody>
        <ModalFooter>
          <Button
            mr={3}
            onClick={onClose}
            variant="clear"
            color="base.content.strong"
          >
            No, leave it
          </Button>
          <Button
            onClick={() => mutate({ pageId, siteId })}
            isLoading={isPending}
            colorScheme="critical"
          >
            Yes, cancel the schedule
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
