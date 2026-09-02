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

interface CancelScheduleUnpublishModalProps extends UseDisclosureReturn {
  pageId: number
  siteId: number
}

export const CancelScheduleUnpublishModal = ({
  pageId,
  siteId,
  onClose,
  ...rest
}: CancelScheduleUnpublishModalProps): JSX.Element => {
  const utils = trpc.useUtils()
  const toast = useToast()
  const { mutate, isPending } = trpc.page.cancelScheduleUnpublish.useMutation({
    onSettled: async () => {
      await Promise.all([
        utils.page.readPage.refetch({ pageId, siteId }),
        utils.site.getLocalisedSitemap.invalidate({
          resourceId: pageId,
          siteId,
        }),
        // Cancelling a schedule changes this resource's liveStatus, which the
        // dashboard tables/index-page row derive from — refresh whichever of
        // these is currently mounted (folder, collection item list, or index
        // page).
        utils.resource.listWithoutRoot.invalidate(),
        utils.collection.list.invalidate(),
        utils.folder.getIndexpage.invalidate(),
      ])
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
      // The "cancel the scheduled unpublish for its child pages first" guard
      // throws PRECONDITION_FAILED with an actionable message — surface it
      // verbatim rather than the generic failure copy.
      toast({
        status: "error",
        title:
          error.data?.code === "PRECONDITION_FAILED"
            ? error.message
            : "Failed to cancel schedule. Please contact Isomer support.",
        ...BRIEF_TOAST_SETTINGS,
      })
    },
  })
  return (
    <Modal onClose={onClose} {...rest}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">
          Are you sure you want to cancel the schedule to unpublish?
        </ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody>
          <Text textStyle="body-2">This page will remain live.</Text>
        </ModalBody>
        <ModalFooter>
          <Button
            mr={3}
            onClick={onClose}
            variant="clear"
            color="base.content.strong"
          >
            No, keep scheduled
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
