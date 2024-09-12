import type { IsomerComponent } from "@opengovsg/isomer-components"
import { Box, Flex, useDisclosure } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { getComponentSchema } from "@opengovsg/isomer-components"
import Ajv from "ajv"
import isEqual from "lodash/isEqual"

import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"
import { editPageSchema } from "../schema"
import { DiscardChangesModal } from "./DiscardChangesModal"
import { DrawerHeader } from "./Drawer/DrawerHeader"
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

  const { pageId, siteId } = useQueryParse(editPageSchema)
  const utils = trpc.useUtils()
  const { mutate, isLoading } = trpc.page.updatePageBlob.useMutation({
    onSuccess: async () => {
      await utils.page.readPageAndBlob.invalidate({ pageId, siteId })
    },
  })

  const subSchema = getComponentSchema("hero")
  const validateFn = ajv.compile<IsomerComponent>(subSchema)

  const handleDiscardChanges = () => {
    setPreviewPageState(savedPageState)
    onDiscardChangesModalClose()
    setDrawerState({ state: "root" })
  }

  const handleChange = (data: IsomerComponent) => {
    const updatedBlocks = Array.from(previewPageState.content)
    updatedBlocks[currActiveIdx] = data
    const newPageState = {
      ...previewPageState,
      content: updatedBlocks,
    }
    setPreviewPageState(newPageState)
  }

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

        <Box px="2rem" py="1rem" flex={1} overflow="auto">
          <FormBuilder<IsomerComponent>
            schema={getComponentSchema("hero")}
            validateFn={validateFn}
            data={previewPageState.content[0]}
            handleChange={handleChange}
          />
        </Box>
        <Box bgColor="base.canvas.default" boxShadow="md" py="1.5rem" px="2rem">
          <Button
            w="100%"
            isLoading={isLoading}
            onClick={() => {
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
            }}
          >
            Save changes
          </Button>
        </Box>
      </Flex>
    </>
  )
}
