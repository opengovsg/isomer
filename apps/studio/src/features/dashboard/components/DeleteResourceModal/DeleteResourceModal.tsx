import { useEffect, useState } from "react"
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
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { isAllowedToHaveChildren } from "~/utils/resources"
import { trpc } from "~/utils/trpc"
import {
  DEFAULT_RESOURCE_MODAL_STATE,
  deleteResourceModalAtom,
} from "../../atoms"

const getResourceLabel = (
  resourceType: ResourceType,
): Lowercase<
  Extract<
    ResourceType,
    | typeof ResourceType.Page
    | typeof ResourceType.Collection
    | typeof ResourceType.Folder
  >
> => {
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

  const deleteResourceMutation = trpc.resource.delete.useMutation()

  useEffect(() => {
    if (deleteResourceMutation.isSuccess || deleteResourceMutation.isError) {
      onClose()
    }
  }, [
    deleteResourceMutation.isSuccess,
    deleteResourceMutation.isError,
    onClose,
  ])

  useEffect(() => {
    if (deleteResourceMutation.isSuccess) {
      void utils.resource.listWithoutRoot.invalidate()
      void utils.resource.getChildrenOf.invalidate()
      void utils.collection.list.invalidate()
      toast({
        title: `${upperFirst(label)} deleted!`,
        status: "success",
        ...BRIEF_TOAST_SETTINGS,
      })
    }
  }, [deleteResourceMutation.isSuccess, label])

  useEffect(() => {
    if (deleteResourceMutation.isError) {
      toast({
        title: `Failed to delete ${label}`,
        status: "error",
        // TODO: check if this property is correct
        description: deleteResourceMutation.error.message,
        ...BRIEF_TOAST_SETTINGS,
      })
    }
  }, [deleteResourceMutation.isError, deleteResourceMutation.error, label])

  const onDelete = () => {
    deleteResourceMutation.mutate({ siteId, resourceId })
  }

  return (
    <ModalContent>
      <ModalHeader mr="3.5rem">Delete {title}?</ModalHeader>
      <ModalCloseButton size="lg" />

      <ModalBody>
        <Text textStyle="body-1">{getWarningText(resourceType)}</Text>
        <HStack mt="1.5rem">
          <Checkbox onChange={() => setIsChecked((prev) => !prev)}>
            <Text textStyle="body-2">Yes, delete this {label} permanently</Text>
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
            isLoading={deleteResourceMutation.isLoading}
          >
            Delete {label}
          </Button>
        </HStack>
      </ModalFooter>
    </ModalContent>
  )
}
