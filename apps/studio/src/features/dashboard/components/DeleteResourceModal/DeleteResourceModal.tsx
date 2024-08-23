import { useState } from "react"
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
import {
  Button,
  Checkbox,
  ModalCloseButton,
  useToast,
} from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { useAtom } from "jotai"
import upperFirst from "lodash/upperFirst"

import type { DeleteResourceModalState } from "../../types"
import { isAllowedToHaveChildren } from "~/utils/resources"
import { trpc } from "~/utils/trpc"
import {
  DEFAULT_RESOURCE_MODAL_STATE,
  deleteResourceModalAtom,
} from "../../atoms"

const getResourceLabel = (
  resourceType: ResourceType,
): Lowercase<Extract<ResourceType, "Page" | "Collection" | "Folder">> => {
  if (!isAllowedToHaveChildren(resourceType)) {
    return "page"
  }

  if (resourceType === ResourceType.Collection) {
    return "collection"
  }

  return "folder"
}

const getWarningText = (resourceType: ResourceType): string => {
  if (!isAllowedToHaveChildren(resourceType)) {
    return "This cannot be undone"
  }

  if (resourceType === ResourceType.Collection) {
    return "All pages under this collection will be deleted. This cannot be undone."
  }

  return "All folders and pages under this folder will be deleted. This cannot be undone."
}

interface DeleteResourceModalProps {
  siteId: number
}

export const DeleteResourceModal = ({
  siteId,
}: DeleteResourceModalProps): JSX.Element => {
  const [{ resourceId, ...rest }, setDeleteCollectionModalState] = useAtom(
    deleteResourceModalAtom,
  )
  const onClose = () =>
    setDeleteCollectionModalState(DEFAULT_RESOURCE_MODAL_STATE)
  return (
    <Modal isOpen={!!resourceId} onClose={onClose}>
      <ModalOverlay />
      {!!resourceId && (
        <DeleteResourceModalContent
          {...rest}
          siteId={siteId}
          resourceId={resourceId}
          onClose={onClose}
        />
      )}
    </Modal>
  )
}

const DeleteResourceModalContent = ({
  onClose,
  title,
  resourceType,
  siteId,
  resourceId,
}: DeleteResourceModalState & { siteId: number; onClose: () => void }) => {
  const label = getResourceLabel(resourceType)
  const utils = trpc.useUtils()
  const toast = useToast()
  const [isChecked, setIsChecked] = useState(false)
  const { mutate, isLoading } = trpc.resource.delete.useMutation({
    onSettled: onClose,
    onSuccess: async () => {
      // TODO: here and elsewhere, we should aim to simplify our query pattern
      // such that the invalidation logic is clear
      await utils.resource.listWithoutRoot.invalidate()
      await utils.resource.getChildrenOf.invalidate()
      await utils.collection.list.invalidate()
      toast({ title: `${upperFirst(label)} deleted!`, status: "success" })
    },
    onError: (err) => {
      toast({
        title: `Failed to delete ${label}`,
        status: "error",
        // TODO: check if this property is correct
        description: err.message,
      })
    },
  })

  const onDelete = () => {
    mutate({ siteId, resourceId })
  }

  return (
    <ModalContent>
      <ModalHeader pr="4.5rem">Delete {title}?</ModalHeader>
      <ModalCloseButton />

      <ModalBody>
        <Text textStyle="body-2">{getWarningText(resourceType)}</Text>
        <HStack mt="1.5rem">
          <Checkbox onChange={() => setIsChecked((prev) => !prev)}>
            Yes, delete this {label} permanently
          </Checkbox>
        </HStack>
      </ModalBody>

      <ModalFooter>
        <HStack spacing="1rem">
          <Button variant="clear" colorScheme="neutral" onClick={onClose}>
            No, keep {label}
          </Button>
          <Button
            isDisabled={!isChecked}
            variant="solid"
            colorScheme="critical"
            onClick={onDelete}
            isLoading={isLoading}
          >
            Delete {label}
          </Button>
        </HStack>
      </ModalFooter>
    </ModalContent>
  )
}
