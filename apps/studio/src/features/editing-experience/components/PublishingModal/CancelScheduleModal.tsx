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

type CancelScheduleAction = "publish" | "unpublish"

const COPY: Record<
  CancelScheduleAction,
  { title: string; description: string }
> = {
  publish: {
    title: "Are you sure you want to cancel the schedule to publish?",
    description: "This page will go back to draft mode.",
  },
  unpublish: {
    title: "Are you sure you want to cancel the schedule to unpublish?",
    description: "This page will remain live.",
  },
}

interface CancelScheduleModalProps extends UseDisclosureReturn {
  action: CancelScheduleAction
  pageId: number
  siteId: number
}

export const CancelScheduleModal = ({
  action,
  pageId,
  siteId,
  onClose,
  ...rest
}: CancelScheduleModalProps): JSX.Element => {
  const { title, description } = COPY[action]
  const utils = trpc.useUtils()
  const toast = useToast()
  const invalidateAfterAction = () =>
    Promise.all([
      utils.page.readPage.refetch({ pageId, siteId }),
      utils.site.getLocalisedSitemap.invalidate({ resourceId: pageId, siteId }),
      // Cancelling a schedule changes this resource's liveStatus, which the
      // dashboard tables/index-page row derive from — refresh whichever of
      // these is currently mounted (folder, collection item list, or index
      // page).
      utils.resource.listWithoutRoot.invalidate(),
      utils.collection.list.invalidate(),
      utils.folder.getIndexpage.invalidate(),
    ])
  // The "cancel the scheduled action for its child pages first" guard throws
  // PRECONDITION_FAILED with an actionable message — surface it verbatim
  // rather than the generic failure copy. Both directions can hit this (see
  // cancelSchedulePublish/cancelScheduleUnpublish in page.service.ts).
  const onError = (error: {
    data?: { code?: string } | null
    message: string
  }) => {
    console.error(`Error occurred when cancelling schedule: ${error.message}`)
    toast({
      status: "error",
      title:
        error.data?.code === "PRECONDITION_FAILED"
          ? error.message
          : "Failed to cancel schedule. Please contact Isomer support.",
      ...BRIEF_TOAST_SETTINGS,
    })
  }
  const onSuccess = () => {
    toast({
      status: "success",
      title: "Schedule cancelled successfully",
      ...BRIEF_TOAST_SETTINGS,
    })
  }

  const { mutate: cancelSchedulePublish, isPending: isCancelPublishPending } =
    trpc.page.cancelSchedulePage.useMutation({
      onSettled: async () => {
        await invalidateAfterAction()
        onClose()
      },
      onSuccess,
      onError,
    })
  const {
    mutate: cancelScheduleUnpublish,
    isPending: isCancelUnpublishPending,
  } = trpc.page.cancelScheduleUnpublish.useMutation({
    onSettled: async () => {
      await invalidateAfterAction()
      onClose()
    },
    onSuccess,
    onError,
  })

  const isPending =
    action === "publish" ? isCancelPublishPending : isCancelUnpublishPending
  const handleConfirm = () =>
    action === "publish"
      ? cancelSchedulePublish({ pageId, siteId })
      : cancelScheduleUnpublish({ pageId, siteId })

  return (
    <Modal onClose={onClose} {...rest}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">{title}</ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody>
          <Text textStyle="body-2">{description}</Text>
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
            onClick={handleConfirm}
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
