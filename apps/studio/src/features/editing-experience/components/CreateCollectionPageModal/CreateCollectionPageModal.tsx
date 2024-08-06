import type { UseDisclosureReturn } from "@chakra-ui/react"
import { Modal, ModalContent, ModalOverlay } from "@chakra-ui/react"

import { CreateCollectionPageWizardProvider } from "./CreateCollectionPageWizardContext"
import { CreateCollectionPageModalScreen } from "./ModalScreen"

interface CreateCollectionPageModalProps
  extends Pick<UseDisclosureReturn, "isOpen" | "onClose"> {
  siteId: number
  collectionId: number
}

export const CreateCollectionPageModal = ({
  isOpen,
  onClose,
  siteId,
  collectionId,
}: CreateCollectionPageModalProps): JSX.Element => {
  return (
    <Modal size="full" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent height="$100vh" overflow="hidden">
        <CreateCollectionPageWizardProvider
          onClose={onClose}
          siteId={siteId}
          collectionId={collectionId}
          key={String(isOpen)}
        >
          <CreateCollectionPageModalScreen />
        </CreateCollectionPageWizardProvider>
      </ModalContent>
    </Modal>
  )
}
