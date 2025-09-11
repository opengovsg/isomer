import {
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react"
import { Button, ModalCloseButton } from "@opengovsg/design-system-react"

interface DeleteGroupModalProps {
  label: string
  subItemsCount: number
  isOpen: boolean
  onClose: () => void
  onDelete: () => void
}

export const DeleteGroupModal = ({
  label,
  subItemsCount,
  isOpen,
  onClose,
  onDelete,
}: DeleteGroupModalProps): JSX.Element => {
  // NOTE: We add 1 to include the main navigation item itself
  const totalLinksToDelete = subItemsCount + 1
  const linkSingularPlural = totalLinksToDelete === 1 ? "link" : "links"

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">
          Delete “{label}”
          {totalLinksToDelete === 1 ? "" : " and all links under it"}?
        </ModalHeader>

        <ModalCloseButton size="lg" />

        <ModalBody>
          {/* NOTE: We  */}
          <Text textStyle="body-1">
            You’re about to delete {totalLinksToDelete} {linkSingularPlural}{" "}
            from the navigation menu. This doesn’t remove any actual pages.
          </Text>
        </ModalBody>

        <ModalFooter>
          <HStack spacing="1rem">
            <Button variant="clear" colorScheme="neutral" onClick={onClose}>
              No, don’t delete
            </Button>
            <Button variant="solid" colorScheme="critical" onClick={onDelete}>
              Delete {linkSingularPlural}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
