import type { IsomerComponent } from "@opengovsg/isomer-components"
import { useCallback } from "react"
import { Box, Flex, useDisclosure } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { getComponentSchema } from "@opengovsg/isomer-components"
import Ajv from "ajv"
import isEmpty from "lodash/isEmpty"
import isEqual from "lodash/isEqual"

import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"
import { editPageSchema } from "../schema"
import { DiscardChangesModal } from "./DiscardChangesModal"
import { DrawerHeader } from "./Drawer/DrawerHeader"
import { ErrorProvider, useBuilderErrors } from "./form-builder/ErrorProvider"
import FormBuilder from "./form-builder/FormBuilder"

const ajv = new Ajv({ strict: false, logger: false })

export default function HeroEditorDrawer(): JSX.Element {
  const {
    isOpen: isDiscardChangesModalOpen,
    onOpen: onDiscardChangesModalOpen,
    onClose: onDiscardChangesModalClose,
  } = useDisclosure()
  const {
    setDrawerState,
    savedPageState,
    setSavedPageState,
    previewPageState,
    currActiveIdx,
    setPreviewPageState,
  } = useEditorDrawerContext()

  const subSchema = getComponentSchema("hero")
  const validateFn = ajv.compile<IsomerComponent>(subSchema)

  const { pageId, siteId } = useQueryParse(editPageSchema)
  const utils = trpc.useUtils()
  const { mutate, isLoading } = trpc.page.updatePageBlob.useMutation({
    onSuccess: async () => {
      await utils.page.readPageAndBlob.invalidate({ pageId, siteId })
    },
  })

  const handleSaveChanges = useCallback(() => {
    setSavedPageState(previewPageState)
    mutate(
      {
        pageId,
        siteId,
        content: JSON.stringify(previewPageState),
      },
      {
        onSuccess: () => setDrawerState({ state: "root" }),
      },
    )
  }, [
    mutate,
    pageId,
    previewPageState,
    setDrawerState,
    setSavedPageState,
    siteId,
  ])

  const handleDiscardChanges = useCallback(() => {
    setPreviewPageState(savedPageState)
    onDiscardChangesModalClose()
    setDrawerState({ state: "root" })
  }, [
    onDiscardChangesModalClose,
    savedPageState,
    setDrawerState,
    setPreviewPageState,
  ])

  const handleChange = useCallback(
    (data: IsomerComponent) => {
      const updatedBlocks = Array.from(previewPageState.content)
      updatedBlocks[currActiveIdx] = data
      const newPageState = {
        ...previewPageState,
        content: updatedBlocks,
      }
      setPreviewPageState(newPageState)
    },
    [currActiveIdx, previewPageState, setPreviewPageState],
  )

  return (
    <>
      <DiscardChangesModal
        isOpen={isDiscardChangesModalOpen}
        onClose={onDiscardChangesModalClose}
        onDiscard={handleDiscardChanges}
      />

      <Flex flexDir="column" position="relative" h="100%" w="100%">
        <DrawerHeader
          isDisabled={isLoading}
          onBackClick={() => {
            if (!isEqual(previewPageState, savedPageState)) {
              onDiscardChangesModalOpen()
            } else {
              handleDiscardChanges()
            }
          }}
          label="Edit Hero banner"
        />

        <ErrorProvider>
          <Box px="1.5rem" py="1rem" flex={1} overflow="auto">
            <FormBuilder<IsomerComponent>
              schema={getComponentSchema("hero")}
              validateFn={validateFn}
              data={previewPageState.content[0]}
              handleChange={handleChange}
            />
          </Box>
          <Box
            bgColor="base.canvas.default"
            boxShadow="md"
            py="1.5rem"
            px="2rem"
          >
            <SaveButton onClick={handleSaveChanges} isLoading={isLoading} />
          </Box>
        </ErrorProvider>
      </Flex>
    </>
  )
}

const SaveButton = ({
  onClick,
  isLoading,
}: {
  onClick: () => void
  isLoading: boolean
}) => {
  const { errors } = useBuilderErrors()

  return (
    <Button
      w="100%"
      isLoading={isLoading}
      isDisabled={!isEmpty(errors)}
      onClick={onClick}
    >
      Save changes
    </Button>
  )
}
