import type { IsomerSchema, schema } from "@opengovsg/isomer-components"
import type { Static } from "@sinclair/typebox"
import { useCallback } from "react"
import { Box, Flex, useDisclosure } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { getLayoutMetadataSchema } from "@opengovsg/isomer-components"
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

export default function MetadataEditorStateDrawer(): JSX.Element {
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
    setPreviewPageState,
  } = useEditorDrawerContext()

  const { pageId, siteId } = useQueryParse(editPageSchema)
  const utils = trpc.useUtils()
  const { mutate, isLoading } = trpc.page.updatePageBlob.useMutation({
    onSuccess: async () => {
      await utils.page.readPageAndBlob.invalidate({ pageId, siteId })
    },
  })

  const metadataSchema = getLayoutMetadataSchema(previewPageState.layout)
  const validateFn = ajv.compile<Static<typeof metadataSchema>>(metadataSchema)

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

  const handleChange = (data: unknown) => {
    // TODO: Perform actual validation on the data
    const newPageState = {
      ...previewPageState,
      page: data,
    } as IsomerSchema

    setPreviewPageState(newPageState)
  }

  const handleDiscardChanges = () => {
    setPreviewPageState(savedPageState)
    onDiscardChangesModalClose()
    setDrawerState({ state: "root" })
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
          label="Edit page description and summary"
        />

        <ErrorProvider>
          <Box px="1.5rem" py="1rem" flex={1} overflow="auto">
            <FormBuilder<Static<typeof schema>>
              schema={metadataSchema}
              validateFn={validateFn}
              data={previewPageState.page}
              handleChange={(data) => handleChange(data)}
            />
          </Box>
          <Box
            bgColor="base.canvas.default"
            boxShadow="md"
            py="1.5rem"
            px="2rem"
          >
            <SaveButton isLoading={isLoading} onClick={handleSaveChanges} />
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
