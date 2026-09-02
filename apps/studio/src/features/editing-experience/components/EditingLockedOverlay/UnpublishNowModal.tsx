import type { UseDisclosureReturn } from "@chakra-ui/react"
import {
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react"
import { Badge, useToast } from "@opengovsg/design-system-react"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { trpc } from "~/utils/trpc"

interface UnpublishNowModalProps extends UseDisclosureReturn {
  pageId: number
  siteId: number
}

export const UnpublishNowModal = ({
  pageId,
  siteId,
  onClose,
  ...rest
}: UnpublishNowModalProps): JSX.Element => {
  const utils = trpc.useUtils()
  const toast = useToast()
  const { mutate, isPending } = trpc.page.unpublishPage.useMutation({
    onSettled: async () => {
      await Promise.all([
        utils.page.readPage.refetch({ pageId, siteId }),
        utils.site.getLocalisedSitemap.invalidate({
          resourceId: pageId,
          siteId,
        }),
        // Unpublishing changes this resource's liveStatus, which the
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
        title: "Page unpublished successfully",
        ...BRIEF_TOAST_SETTINGS,
      })
    },
    onError: (error) => {
      console.error(`Error occurred when unpublishing page: ${error.message}`)
      toast({
        status: "error",
        title: "Failed to unpublish page. Please contact Isomer support.",
        ...BRIEF_TOAST_SETTINGS,
      })
    },
  })

  return (
    <Modal onClose={onClose} {...rest}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">
          <HStack spacing="0.5rem">
            <Text as="span">
              Are you sure you want to unpublish this page now?
            </Text>
            <Badge size="xs" variant="subtle" colorScheme="neutral">
              Beta
            </Badge>
          </HStack>
        </ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody>
          <Text textStyle="body-2">
            It may still appear in search results until search engines next
            crawl your site. Any unsaved draft changes will be kept. This will
            also cancel the existing scheduled unpublish.
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
            Yes, unpublish now
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
