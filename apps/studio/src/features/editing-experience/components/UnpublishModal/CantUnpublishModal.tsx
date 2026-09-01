import type { UseDisclosureReturn } from "@chakra-ui/react"
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react"
import { Button, ModalCloseButton } from "@opengovsg/design-system-react"
import { useRouter } from "next/router"
import { getLinkToResource } from "~/utils/resource"
import { ResourceType } from "~prisma/generated/generatedEnums"

interface CantUnpublishModalProps extends UseDisclosureReturn {
  siteId: number
  parentId: string
  // In practice always Folder or Collection (an IndexPage's only possible
  // parent types), but typed as the full enum since that's what the
  // resource lookup backing this returns.
  parentType: ResourceType
  count: number
}

export const CantUnpublishModal = ({
  siteId,
  parentId,
  parentType,
  count,
  onClose,
  ...rest
}: CantUnpublishModalProps): JSX.Element => {
  const router = useRouter()
  const label = parentType === ResourceType.Collection ? "collection" : "folder"

  return (
    <Modal onClose={onClose} {...rest}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">Can't unpublish this {label} yet</ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody>
          <Text textStyle="body-2">
            This {label} has {count} published page{count === 1 ? "" : "s"}{" "}
            inside, including pages in subfolders. Unpublish those pages first,
            then you'll be able to unpublish the {label}.
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button
            mr={3}
            onClick={onClose}
            variant="clear"
            color="base.content.strong"
          >
            Got it
          </Button>
          <Button
            onClick={() =>
              router.push(
                getLinkToResource({
                  siteId: String(siteId),
                  type: parentType,
                  resourceId: parentId,
                }),
              )
            }
          >
            Go to {label}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
