import type { UseDisclosureReturn } from "@chakra-ui/react"
import {
  Box,
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
import posthog from "posthog-js"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { trpc } from "~/utils/trpc"

import { useUnpublishRedirectCount } from "../../hooks/useUnpublishRedirectCount"
import { UnpublishRedirectWarning } from "../UnpublishRedirectWarning"

type PublishOrUnpublishNowAction = "publish" | "unpublish"

const COPY: Record<
  PublishOrUnpublishNowAction,
  {
    title: string
    description: string
    confirmLabel: string
    successTitle: string
    errorTitle: string
  }
> = {
  publish: {
    title: "Are you sure you want to publish this page now?",
    description:
      "Changes will be live on your site in approximately 5–10 minutes, and its status will change to Published.",
    confirmLabel: "Yes, publish now",
    successTitle: "Page published successfully",
    errorTitle: "Failed to publish page. Please contact Isomer support.",
  },
  unpublish: {
    title: "Are you sure you want to unpublish this page now?",
    description:
      "It may still appear in search results until search engines next crawl your site. Any unsaved draft changes will be kept. This will also cancel the existing scheduled unpublish.",
    confirmLabel: "Yes, unpublish now",
    successTitle: "Page unpublished successfully",
    errorTitle: "Failed to unpublish page. Please contact Isomer support.",
  },
}

interface PublishOrUnpublishNowModalProps extends UseDisclosureReturn {
  action: PublishOrUnpublishNowAction
  pageId: number
  siteId: number
}

export const PublishOrUnpublishNowModal = ({
  action,
  pageId,
  siteId,
  onClose,
  ...rest
}: PublishOrUnpublishNowModalProps): JSX.Element => {
  const { title, description, confirmLabel, successTitle, errorTitle } =
    COPY[action]
  // Only unpublish renders the redirect check, so only it can be pending.
  const { data: redirectCountData, isPending: isRedirectQueryPending } =
    useUnpublishRedirectCount({
      pageId,
      siteId,
      enabled: action === "unpublish",
    })
  // Gate on isPending, not isLoading, so an offline-paused first fetch still
  // disables confirm. Scoped to unpublish: the query is disabled for publish.
  const isRedirectCheckPending = action === "unpublish" && isRedirectQueryPending
  // Tagged on the unpublish success event, mirroring PublishOrUnpublishModal.
  const redirectCount = redirectCountData ?? null
  const utils = trpc.useUtils()
  const toast = useToast()
  const invalidateAfterAction = () =>
    Promise.all([
      utils.page.readPage.refetch({ pageId, siteId }),
      utils.site.getLocalisedSitemap.invalidate({ resourceId: pageId, siteId }),
      // Publishing/unpublishing changes this resource's liveStatus, which the
      // dashboard tables/index-page row derive from. Refresh whichever of
      // these is currently mounted (folder, collection item list, or index
      // page).
      utils.resource.listWithoutRoot.invalidate(),
      utils.collection.list.invalidate(),
      utils.folder.getIndexpage.invalidate(),
    ])

  const { mutate: publish, isPending: isPublishPending } =
    trpc.page.publishPage.useMutation({
      onSettled: async () => {
        await invalidateAfterAction()
        onClose()
      },
      onSuccess: () => {
        toast({
          status: "success",
          title: successTitle,
          ...BRIEF_TOAST_SETTINGS,
        })
      },
      onError: (error) => {
        console.error(`Error occurred when publishing page: ${error.message}`)
        toast({ status: "error", title: errorTitle, ...BRIEF_TOAST_SETTINGS })
      },
    })
  const { mutate: unpublish, isPending: isUnpublishPending } =
    trpc.page.unpublishPage.useMutation({
      onSettled: async () => {
        await invalidateAfterAction()
        onClose()
      },
      onSuccess: () => {
        // "scheduled_override" sets this apart from the more-actions flow: the
        // user brought a scheduled unpublish forward, cancelling the schedule.
        posthog.capture("page_unpublished", {
          site_id: siteId,
          redirect_count: redirectCount,
          source: "scheduled_override",
        })
        toast({
          status: "success",
          title: successTitle,
          ...BRIEF_TOAST_SETTINGS,
        })
      },
      onError: (error) => {
        console.error(`Error occurred when unpublishing page: ${error.message}`)
        toast({ status: "error", title: errorTitle, ...BRIEF_TOAST_SETTINGS })
      },
    })

  const isPending = action === "publish" ? isPublishPending : isUnpublishPending
  const handleConfirm = () =>
    action === "publish"
      ? publish({ pageId, siteId })
      : unpublish({ pageId, siteId })

  return (
    <Modal onClose={onClose} {...rest}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">{title}</ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody>
          <Text textStyle="body-2">{description}</Text>
          {action === "unpublish" && (
            <Box mt="1rem">
              <UnpublishRedirectWarning pageId={pageId} siteId={siteId} />
            </Box>
          )}
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
            isDisabled={isRedirectCheckPending}
            isLoading={isPending}
          >
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
