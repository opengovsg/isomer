import { Box, HStack } from "@chakra-ui/react"
import { IconButton } from "@opengovsg/design-system-react"
import { BiTrash } from "react-icons/bi"

import { ComplexEditorStateDrawerSaveButton } from "./ComplexEditorStateDrawerSaveButton"

interface ComplexEditorStateDrawerFooterProps {
  isLoading: boolean
  onDeleteBlockModalOpen: () => void
  onSave: () => void
  isNonEditableBlock: boolean
}

export const ComplexEditorStateDrawerFooter = ({
  isLoading,
  onDeleteBlockModalOpen,
  onSave,
  isNonEditableBlock,
}: ComplexEditorStateDrawerFooterProps) => 
  (
    <Box bgColor="base.canvas.default" boxShadow="md" py="1.5rem" px="2rem">
      <HStack spacing="0.75rem">
        <IconButton
          icon={<BiTrash fontSize="1.25rem" />}
          variant="outline"
          colorScheme="critical"
          aria-label="Delete block"
          onClick={onDeleteBlockModalOpen}
        />
        <Box w="100%">
          <ComplexEditorStateDrawerSaveButton
            onClick={onSave}
            isLoading={isLoading}
            isNonEditableBlock={isNonEditableBlock}
          />
        </Box>
      </HStack>
    </Box>
  )

