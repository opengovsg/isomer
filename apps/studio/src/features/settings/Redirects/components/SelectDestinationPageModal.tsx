import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react"
import {
  Button,
  ModalCloseButton,
  useToast,
} from "@opengovsg/design-system-react"
import { useState } from "react"
import { ResourceSelector } from "~/components/ResourceSelector"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { trpc } from "~/utils/trpc"

interface SelectDestinationPageModalProps {
  isOpen: boolean
  siteId: number
  onClose: () => void
  // Receives the selected page's current full permalink. The redirect stores
  // this as a reference server-side, so the permalink is only what we show.
  onSelect: (permalink: string) => void
}

export const SelectDestinationPageModal = ({
  isOpen,
  siteId,
  onClose,
  onSelect,
}: SelectDestinationPageModalProps): JSX.Element => {
  const toast = useToast(BRIEF_TOAST_SETTINGS)
  const utils = trpc.useUtils()
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(
    null,
  )
  const [isResolving, setIsResolving] = useState(false)

  const handleClose = () => {
    setSelectedResourceId(null)
    onClose()
  }

  const handleConfirm = async () => {
    if (!selectedResourceId) return
    setIsResolving(true)
    try {
      // Resolve the picked resource to its current permalink so the user sees a
      // real path in the input; conversion back to a reference happens on save.
      const permalink = await utils.page.getFullPermalink.fetch({
        siteId,
        pageId: Number(selectedResourceId),
      })
      onSelect(permalink)
      handleClose()
    } catch {
      toast({
        title: "Couldn't select this page",
        description: "Please try again.",
        status: "error",
      })
    } finally {
      setIsResolving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">Link to a page</ModalHeader>
        <ModalCloseButton size="lg" />

        <ModalBody>
          <ResourceSelector
            interactionType="link"
            siteId={siteId}
            onChange={setSelectedResourceId}
            selectedResourceId={selectedResourceId ?? undefined}
          />
        </ModalBody>

        <ModalFooter>
          <Button
            variant="clear"
            colorScheme="neutral"
            onClick={handleClose}
            mr="1rem"
          >
            Cancel
          </Button>
          <Button
            isDisabled={!selectedResourceId}
            isLoading={isResolving}
            onClick={() => void handleConfirm()}
          >
            Use this page
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
