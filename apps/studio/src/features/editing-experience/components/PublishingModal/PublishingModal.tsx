import type { UseDisclosureReturn } from "@chakra-ui/react"
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react"
import { Button } from "@opengovsg/oui"

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
            className="mr-3"
            onPress={onClose}
            variant="clear"
            color="neutral"
          >
            No, don't publish
          </Button>
          <Button
            onPress={() => {
              onPublishNow(pageId, siteId)
            }}
            isPending={isPublishingNow}
          >
            Publish now
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
