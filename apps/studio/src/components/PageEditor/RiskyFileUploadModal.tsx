import {
  HStack,
  Icon,
  ListItem,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  UnorderedList,
} from "@chakra-ui/react"
import {
  Button,
  Checkbox,
  ModalCloseButton,
} from "@opengovsg/design-system-react"
import { useState } from "react"
import { BiSolidErrorCircle } from "react-icons/bi"
import { getFileExtension } from "~/utils/getFileExtension"

interface RiskyFileUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  file: File
}

export const RiskyFileUploadModal = ({
  isOpen,
  onClose,
  onConfirm,
  file,
}: RiskyFileUploadModalProps) => {
  const fileExtension = getFileExtension(file.name)
  const [isChecked, setIsChecked] = useState(false)
  const [showCheckboxError, setShowCheckboxError] = useState(false)

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem" textStyle="h4" textColor="base.content.strong">
          Before you upload
        </ModalHeader>
        <ModalCloseButton size="lg" />

        <ModalBody>
          <Text textStyle="body-1" textColor="base.content.strong">
            You're uploading a {fileExtension} file. This comes with two risks
            you should be aware of:
          </Text>
          <br />
          <UnorderedList spacing="0.75rem" pl="1.25rem" ml={0}>
            <ListItem>
              <Text textStyle="body-1" textColor="base.content.strong">
                <Text as="span" textStyle="subhead-1">
                  Malware:
                </Text>{" "}
                {fileExtension} files can carry malicious code that may not be
                caught by our scanner. Make sure you only upload files from
                trusted sources.
              </Text>
            </ListItem>
            <ListItem>
              <Text textStyle="body-1" textColor="base.content.strong">
                <Text as="span" textStyle="subhead-1">
                  Accessibility:
                </Text>{" "}
                Not everyone can open {fileExtension}. It's difficult to view{" "}
                {fileExtension} files on mobile. Consider whether this affects
                your users.
              </Text>
            </ListItem>
          </UnorderedList>
          <br />
          <Text textStyle="body-1" textColor="base.content.strong">
            Only continue uploading if you're comfortable managing these risks.
            Otherwise, consider converting your file into a .pdf instead.
          </Text>
          <Checkbox
            mt="1.25rem"
            backgroundColor="base.canvas.alt"
            py="1.375rem"
            px="1.25rem"
            isChecked={isChecked}
            isInvalid={showCheckboxError}
            onChange={(e) => {
              const checked = e.target.checked
              setIsChecked(checked)
              if (checked) {
                setShowCheckboxError(false)
              }
            }}
          >
            <Stack spacing="0.625rem" align="flex-start">
              <Text textStyle="body-1" textColor="base.content.strong">
                I've read and accept the risks.
              </Text>
              {showCheckboxError && (
                <HStack gap="0.5rem" align="flex-start">
                  <Icon
                    as={BiSolidErrorCircle}
                    fontSize="1rem"
                    color="utility.feedback.critical"
                    flexShrink={0}
                    mt="0.125rem"
                  />
                  <Text
                    textStyle="body-2"
                    textColor="utility.feedback.critical"
                  >
                    You must accept the risks to upload the file.
                  </Text>
                </HStack>
              )}
            </Stack>
          </Checkbox>
        </ModalBody>

        <ModalFooter gap="0.75rem">
          <Button
            aria-disabled={!isChecked}
            variant="solid"
            onClick={() => {
              if (!isChecked) {
                setShowCheckboxError(true)
                return
              }
              onConfirm()
              onClose()
            }}
          >
            Upload file
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
