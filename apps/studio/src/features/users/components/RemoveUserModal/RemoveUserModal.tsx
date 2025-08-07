import { useCallback, useEffect } from "react"
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react"
import { Button, useToast } from "@opengovsg/design-system-react"
import { useAtomValue, useSetAtom } from "jotai"

import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useIsSingpassEnabled } from "~/hooks/useIsSingpassEnabled"
import { trpc } from "~/utils/trpc"
import {
  DEFAULT_REMOVE_USER_MODAL_STATE,
  removeUserModalAtom,
} from "../../atoms"
import { SingpassConditionalTooltip } from "../SingpassConditionalTooltip"
import { UserInfoContent } from "./UserInfoContent"

export const RemoveUserModal = () => {
  const toast = useToast()
  const utils = trpc.useUtils()

  const { siteId, userId } = useAtomValue(removeUserModalAtom)
  const setRemoveUserModalState = useSetAtom(removeUserModalAtom)

  const onClose = useCallback(
    () => setRemoveUserModalState(DEFAULT_REMOVE_USER_MODAL_STATE),
    [setRemoveUserModalState],
  )

  const isSingpassEnabled = useIsSingpassEnabled()

  const deleteUserMutation = trpc.user.delete.useMutation()

  useEffect(() => {
    if (deleteUserMutation.isSuccess || deleteUserMutation.isError) {
      onClose()
    }
  }, [deleteUserMutation.isSuccess, deleteUserMutation.isError, onClose])

  useEffect(() => {
    if (deleteUserMutation.isSuccess) {
      void utils.user.list.invalidate()
      void utils.user.count.invalidate()
      toast({
        status: "success",
        title: `Removed ${deleteUserMutation.data.email} from site.`,
        ...BRIEF_TOAST_SETTINGS,
      })
    }
  }, [deleteUserMutation.isSuccess, deleteUserMutation.data, utils, toast])

  useEffect(() => {
    if (deleteUserMutation.isError) {
      toast({
        status: "error",
        title: "Failed to remove user",
        description: deleteUserMutation.error.message,
        ...BRIEF_TOAST_SETTINGS,
      })
    }
  }, [deleteUserMutation.isError, deleteUserMutation.error, toast])

  return (
    <Modal isOpen={!!siteId && !!userId} onClose={onClose}>
      <ModalOverlay>
        <ModalContent>
          <ModalHeader mr="3.5rem">Remove user from this site?</ModalHeader>
          <ModalCloseButton size="lg" />
          <ModalBody>
            <VStack gap="1rem">
              <UserInfoContent siteId={siteId} userId={userId} />
              <Text textStyle="body-1" color="base.content.default">
                This user will no longer be able to access this site on Studio.
                We won't notify them, but they'll know after logging in to
                Studio.
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter gap="1rem">
            <Button
              variant="clear"
              color="base.content.default"
              onClick={onClose}
            >
              No, cancel
            </Button>
            <SingpassConditionalTooltip>
              <Button
                colorScheme="critical"
                variant="solid"
                onClick={() => deleteUserMutation.mutate({ siteId, userId })}
                isLoading={deleteUserMutation.isPending}
                isDisabled={!isSingpassEnabled}
              >
                Remove user
              </Button>
            </SingpassConditionalTooltip>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  )
}
