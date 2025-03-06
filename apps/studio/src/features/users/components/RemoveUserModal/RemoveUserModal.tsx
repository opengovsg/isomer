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
import { trpc } from "~/utils/trpc"
import {
  DEFAULT_REMOVE_USER_MODAL_STATE,
  removeUserModalAtom,
} from "../../atoms"
import { UserInfoContent } from "./UserInfoContent"

export const RemoveUserModal = () => {
  const toast = useToast()
  const utils = trpc.useUtils()

  const { siteId, userId } = useAtomValue(removeUserModalAtom)
  const setRemoveUserModalState = useSetAtom(removeUserModalAtom)
  const onClose = () => setRemoveUserModalState(DEFAULT_REMOVE_USER_MODAL_STATE)

  const { mutate, isLoading } = trpc.user.delete.useMutation({
    onSettled: onClose,
    onSuccess: async (result) => {
      await utils.user.list.invalidate()
      await utils.user.count.invalidate()
      await utils.user.hasInactiveUsers.invalidate()
      toast({
        status: "success",
        title: `Removed ${result.email} from site.`,
        ...BRIEF_TOAST_SETTINGS,
      })
    },
    onError: (err) => {
      toast({
        status: "error",
        title: "Failed to remove user",
        description: err.message,
        ...BRIEF_TOAST_SETTINGS,
      })
    },
  })

  const onRemoveUser = () => {
    mutate({ siteId, userId })
  }

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
            <Button
              colorScheme="critical"
              variant="solid"
              onClick={onRemoveUser}
              isLoading={isLoading}
            >
              Remove user
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  )
}
