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

interface PublishNowModalProps extends UseDisclosureReturn {
  pageId: number
  siteId: number
}

export const PublishNowModal = ({
  pageId,
  siteId,
  onClose,
  ...rest
}: PublishNowModalProps): JSX.Element => {
  const utils = trpc.useUtils()
  const toast = useToast()
  const { mutate, isPending } = trpc.page.publishPage.useMutation({
    onSettled: async () => {
      await Promise.all([
        utils.page.readPage.refetch({ pageId, siteId }),
        utils.site.getLocalisedSitemap.invalidate({
          resourceId: pageId,
          siteId,
        }),
        // Publishing changes this resource's liveStatus, which the dashboard
        // tables/index-page row derive from — refresh whichever of these is
        // currently mounted (folder, collection item list, or index page).
        utils.resource.listWithoutRoot.invalidate(),
        utils.collection.list.invalidate(),
        utils.folder.getIndexpage.invalidate(),
      ])
      onClose()
    },
    onSuccess: () => {
      toast({
        status: "success",
        title: "Page published successfully",
        ...BRIEF_TOAST_SETTINGS,
      })
    },
    onError: (error) => {
      console.error(`Error occurred when publishing page: ${error.message}`)
      toast({
        status: "error",
        title: "Failed to publish page. Please contact Isomer support.",
        ...BRIEF_TOAST_SETTINGS,
      })
    },
  })

  return (
    <Modal onClose={onClose} {...rest}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">
          Are you sure you want to publish this page now?
        </ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody>
          <Text textStyle="body-2">
            Changes will be live on your site in approximately 5–10 minutes, and
            its status will change to Live.
          </Text>
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
          >
            Yes, publish now
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
