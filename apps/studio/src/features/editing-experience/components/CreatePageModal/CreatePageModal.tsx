import type { UseDisclosureReturn } from "@chakra-ui/react"
import { Modal, ModalContent, ModalOverlay } from "@chakra-ui/react"
import { ModalCloseButton } from "@opengovsg/design-system-react"

import { CreatePageWizardProvider } from "./CreatePageWizardContext"
import { CreatePageModalScreen } from "./ModalScreen"

interface CreatePageModalProps
  extends Pick<UseDisclosureReturn, "isOpen" | "onClose"> {
  siteId: number
  folderId?: number
}

export const CreatePageModal = ({
  isOpen,
  onClose,
  siteId,
  folderId,
}: CreatePageModalProps): JSX.Element => {
  return (
    <Modal size="full" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent height="$100vh" overflow="hidden">
        <ModalCloseButton />
        <CreatePageWizardProvider
          onClose={onClose}
          siteId={siteId}
          folderId={folderId}
          key={String(isOpen)}
        >
          <CreatePageModalScreen />
        </CreatePageWizardProvider>
      </ModalContent>
    </Modal>
  )
}
