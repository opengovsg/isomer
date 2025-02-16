import {
  Box,
  Button,
  Heading,
  HStack,
  Icon,
  IconButton,
  Spacer,
  Textarea,
  useClipboard,
  useDisclosure,
} from "@chakra-ui/react"
import { BiDollar, BiX } from "react-icons/bi"

import { DiscardChangesModal } from "./DiscardChangesModal"

interface RawJsonEditorProps {
  pendingChanges: string
  isModified: boolean
  isLoading: boolean
  isPendingChangesValid: boolean
  handleChange: (value: string) => void
  handleDiscardChanges: () => void
  handleSaveChanges: () => void
}

export const RawJsonEditor = ({
  pendingChanges,
  isModified,
  isLoading,
  isPendingChangesValid,
  handleChange,
  handleDiscardChanges,
  handleSaveChanges,
}: RawJsonEditorProps) => {
  const {
    isOpen: isDiscardChangesModalOpen,
    onOpen: onDiscardChangesModalOpen,
    onClose: onDiscardChangesModalClose,
  } = useDisclosure()
  const { onCopy, hasCopied } = useClipboard(pendingChanges)

  return (
    <>
      <DiscardChangesModal
        isOpen={isDiscardChangesModalOpen}
        onClose={onDiscardChangesModalClose}
        onDiscard={() => {
          handleDiscardChanges()
          onDiscardChangesModalClose()
        }}
      />

      <Box h="100%" w="100%" overflow="auto">
        <Box
          bgColor="base.canvas.default"
          borderBottomColor="base.divider.medium"
          borderBottomWidth="1px"
          px="2rem"
          py="1.25rem"
        >
          <HStack justifyContent="start" w="100%">
            <HStack spacing={3}>
              <Icon
                as={BiDollar}
                fontSize="1.5rem"
                p="0.25rem"
                bgColor="slate.100"
                textColor="blue.600"
                borderRadius="base"
              />
              <Heading as="h3" size="sm" textStyle="h5" fontWeight="semibold">
                Raw JSON Editor Mode
              </Heading>
            </HStack>
            <Spacer />
            <Button onClick={onCopy} variant="clear">
              {!hasCopied ? "Copy to clipboard" : "Copied!"}
            </Button>
            <IconButton
              icon={<Icon as={BiX} />}
              variant="clear"
              colorScheme="sub"
              size="sm"
              p="0.625rem"
              onClick={() => {
                if (isModified) {
                  onDiscardChangesModalOpen()
                } else {
                  handleDiscardChanges()
                }
              }}
              aria-label="Close drawer"
            />
          </HStack>
        </Box>

        <Box px="2rem" py="1rem" maxW="33vw" overflow="auto">
          <Textarea
            fontFamily="monospace"
            boxSizing="border-box"
            minH="68vh"
            value={pendingChanges}
            onChange={(e) => handleChange(e.target.value)}
          />
        </Box>

        <Box bgColor="base.canvas.default" boxShadow="md" py="1.5rem" px="2rem">
          <Button
            w="100%"
            isLoading={isLoading}
            isDisabled={!isPendingChangesValid}
            onClick={handleSaveChanges}
          >
            Save changes
          </Button>
        </Box>
      </Box>
    </>
  )
}
