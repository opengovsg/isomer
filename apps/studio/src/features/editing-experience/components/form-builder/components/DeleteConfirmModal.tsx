import type { ReactNode } from "react"
import {
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react"
import {
  Button,
  Checkbox,
  Infobox,
  ModalCloseButton,
} from "@opengovsg/design-system-react"
import { useState } from "react"

interface DeleteConfirmModalProps {
  isOpen: boolean
  label: string
  /** Singular noun, e.g. "filter" or "option" */
  noun: string
  /** Content rendered inside the warning Infobox */
  warningBody: ReactNode
  /** When set, replaces the default "Delete {noun} \"{label}\"?" header */
  title?: ReactNode
  /** When set, replaces the default checkbox label */
  confirmCheckboxLabel?: string
  onClose: () => void
  onConfirm: () => void
}

export function DeleteConfirmModal({
  isOpen,
  label,
  noun,
  warningBody,
  title,
  confirmCheckboxLabel,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  const [isChecked, setIsChecked] = useState(false)

  const defaultTitle =
    label.length > 0 ? `Delete ${noun} "${label}"?` : `Delete ${noun}?`

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">{title ?? defaultTitle}</ModalHeader>
        <ModalCloseButton size="lg" />

        <ModalBody>
          <VStack align="stretch" spacing="1.5rem">
            <Infobox width="100%" size="md" variant="warning">
              {warningBody}
            </Infobox>
            <HStack align="start">
              <Checkbox
                isChecked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
              >
                <Text textStyle="body-2">
                  {confirmCheckboxLabel ??
                    `Yes, delete this ${noun} permanently`}
                </Text>
              </Checkbox>
            </HStack>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing="1rem">
            <Button variant="clear" colorScheme="neutral" onClick={onClose}>
              No, keep {noun}
            </Button>
            <Button
              isDisabled={!isChecked}
              variant="solid"
              colorScheme="critical"
              onClick={onConfirm}
            >
              Delete {noun}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
