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
import { Button } from "@opengovsg/design-system-react"
import { useAtomValue, useSetAtom } from "jotai"

import {
  DEFAULT_REMOVE_USER_MODAL_STATE,
  removeUserModalAtom,
} from "../../atoms"
import { UserInfoContent } from "./UserInfoContent"

export const RemoveUserModal = () => {
  const { siteId, userId } = useAtomValue(removeUserModalAtom)
  const setRemoveUserModalState = useSetAtom(removeUserModalAtom)
  const onClose = () => setRemoveUserModalState(DEFAULT_REMOVE_USER_MODAL_STATE)

  return (
    <Modal isOpen={!!siteId && !!userId} onClose={onClose}>
      <ModalOverlay>
        <ModalContent>
          <ModalHeader mr="3.5rem">Remove user from this site?</ModalHeader>
          <ModalCloseButton size="lg" />
          <ModalBody>
            <VStack gap="1rem">
              <UserInfoContent siteId={siteId} userId={userId} />
              <Text textStyle="body-1">
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
            <Button colorScheme="critical" variant="solid">
              Remove user
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  )
}
