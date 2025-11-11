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

interface PublishingModalProps extends UseDisclosureReturn {
  pageId: number
  siteId: number
  // callback invoked to handle the publishing process now
  onPublishNow: (pageId: number, siteId: number) => void
  // used for the loading state of the publish button
  isPublishingNow?: boolean
}

export const PublishingModal = ({
  pageId,
  siteId,
  onPublishNow,
  isPublishingNow,
  onClose,
  ...rest
}: PublishingModalProps): JSX.Element => {
  return (
    <Modal onClose={onClose} {...rest}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">Publish this page?</ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody>
          <Text textStyle="body-1" color="base.content.default">
            Changes will be live on your site in approximately 5-10 minutes.
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button
            mr={3}
            onClick={onClose}
            variant="clear"
            color="base.content.strong"
          >
            No, don't publish
          </Button>
          <Button
            onClick={() => {
              onPublishNow(pageId, siteId)
            }}
            isLoading={isPublishingNow}
          >
            Publish now
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
