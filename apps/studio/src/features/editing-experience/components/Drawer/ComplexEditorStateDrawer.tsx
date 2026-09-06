import { Box, Flex } from "@chakra-ui/react"

import { DeleteBlockModal } from "../DeleteBlockModal"
import { DiscardChangesModal } from "../DiscardChangesModal"
import { ErrorProvider } from "../form-builder/ErrorProvider"
import FormBuilder from "../form-builder/FormBuilder"
import { ComplexEditorStateDrawerFooter } from "./ComplexEditorStateDrawerFooter"
import { DrawerHeader } from "./DrawerHeader"
import { useComplexEditorStateDrawer } from "./useComplexEditorStateDrawer"

const ComplexEditorStateDrawer = (): React.ReactNode | null => {
  const {
    modalState: { isDeleteBlockModalOpen, isDiscardChangesModalOpen },
    onDeleteBlockModalOpen,
    onDeleteBlockModalClose,
    onDiscardChangesModalClose,
    handleDeleteBlock,
    handleDiscardChanges,
    handleBackClick,
    uiState: { isLoading, isNonEditableBlock },
    component,
    subSchema,
    validateFn,
    componentName,
    isInvalidIndex,
    handleChange,
    handleSave,
  } = useComplexEditorStateDrawer()

  if (isInvalidIndex || !component || !subSchema || !validateFn) {
    return null
  }

  return (
    <>
      <DeleteBlockModal
        itemName={componentName}
        isOpen={isDeleteBlockModalOpen}
        onClose={onDeleteBlockModalClose}
        onDelete={handleDeleteBlock}
      />

      <DiscardChangesModal
        isOpen={isDiscardChangesModalOpen}
        onClose={onDiscardChangesModalClose}
        onDiscard={handleDiscardChanges}
      />

      <Flex flexDir="column" position="relative" h="100%" w="100%">
        <DrawerHeader
          isDisabled={isLoading}
          onBackClick={handleBackClick}
          label={`Edit ${componentName}`}
        />
        <ErrorProvider>
          <Box flex={1} overflow="auto" px="1.5rem" py="1rem">
            <Box mb="1rem">
              <FormBuilder
                schema={subSchema}
                validateFn={validateFn}
                data={component}
                handleChange={handleChange}
              />
            </Box>
          </Box>
          <ComplexEditorStateDrawerFooter
            isLoading={isLoading}
            onDeleteBlockModalOpen={onDeleteBlockModalOpen}
            onSave={handleSave}
            isNonEditableBlock={isNonEditableBlock}
          />
        </ErrorProvider>
      </Flex>
    </>
  )
}

export default ComplexEditorStateDrawer
