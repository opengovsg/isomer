import { useState } from "react"
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from "@chakra-ui/react"
import {
  Button,
  Checkbox,
  ModalCloseButton,
} from "@opengovsg/design-system-react"

interface RiskyFileUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  fileExtension: string
}

export const RiskyFileUploadModal = ({
  isOpen,
  onClose,
  onConfirm,
  fileExtension,
}: RiskyFileUploadModalProps) => {
  const [isChecked, setIsChecked] = useState(false)
  const [hasClickedConfirm, setHasClickedConfirm] = useState(false)
  const showUncheckedError = hasClickedConfirm && !isChecked

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">Before you upload</ModalHeader>
        <ModalCloseButton size="lg" />

        <ModalBody>
          <Text textStyle="body-1" mb="1rem">
            You&apos;re uploading{" "}
            <Text as="span" textStyle="subhead-1">
              {fileExtension}
            </Text>{" "}
            files. This comes with two risks you should be aware of:
          </Text>
          <Stack spacing="1rem">
            <Stack spacing="0.25rem">
              <Text textStyle="subhead-2">Malware</Text>
              <Text textStyle="body-2">
                <Text as="span" textStyle="subhead-2">
                  {fileExtension}
                </Text>{" "}
                files can carry malicious code that may not be caught by our
                scanner. Make sure you only upload files from trusted sources.
              </Text>
            </Stack>
            <Stack spacing="0.25rem">
              <Text textStyle="subhead-2">Accessibility</Text>
              <Text textStyle="body-2">
                Not everyone can open a{" "}
                <Text as="span" textStyle="subhead-2">
                  {fileExtension}
                </Text>
                . It&apos;s difficult to view .docx/.xlsx files on mobile.
                Consider whether this affects your users.
              </Text>
            </Stack>
          </Stack>
          <Text textStyle="body-2" mt="1.5rem" color="base.content.medium">
            Only continue uploading if you&apos;re comfortable managing these
            risks. Otherwise, consider converting your file(s) into a .pdf
            instead.
          </Text>
          <Stack mt="1rem" backgroundColor="#f8f9f9">
            <Stack p="1rem" gap={0}>
              <Checkbox onChange={() => setIsChecked((prev) => !prev)}>
                <Text textStyle="body-2">
                  I&apos;ve read and accept the risks.
                </Text>
              </Checkbox>
              {showUncheckedError && (
                <Text textStyle="body-2" color="red" ml="2.5rem">
                  You must accept the risks to accept the file(s).
                </Text>
              )}
            </Stack>
          </Stack>
        </ModalBody>

        <ModalFooter gap="0.75rem">
          <Button
            variant="solid"
            onClick={() => {
              setHasClickedConfirm(true)
              if (isChecked) {
                onConfirm()
                onClose()
              }
            }}
          >
            Upload file(s)
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
