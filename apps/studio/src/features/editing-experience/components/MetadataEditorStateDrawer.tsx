import type { IsomerSchema } from "@opengovsg/isomer-components"
import type { Static } from "@sinclair/typebox"
import { useCallback } from "react"
import { Box, Flex, Text, useDisclosure } from "@chakra-ui/react"
import { Button, Infobox, useToast } from "@opengovsg/design-system-react"
import {
  getLayoutPageSchema,
  ISOMER_USABLE_PAGE_LAYOUTS,
} from "@opengovsg/isomer-components"
import isEmpty from "lodash/isEmpty"
import isEqual from "lodash/isEqual"

import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useQueryParse } from "~/hooks/useQueryParse"
import { ajv } from "~/utils/ajv"
import { trpc } from "~/utils/trpc"
import { pageSchema } from "../schema"
import { CHANGES_SAVED_PLEASE_PUBLISH_MESSAGE } from "./constants"
import { DiscardChangesModal } from "./DiscardChangesModal"
import { DrawerHeader } from "./Drawer/DrawerHeader"
import { ErrorProvider, useBuilderErrors } from "./form-builder/ErrorProvider"
import FormBuilder from "./form-builder/FormBuilder"

const HEADER_LABELS: Record<string, string> = {
  article: "Edit article page header",
  content: "Edit content page header",
  index: "Edit index page header",
  database: "Edit page header",
}

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

  const { pageId, siteId } = useQueryParse(pageSchema)
  const toast = useToast()
  const utils = trpc.useUtils()
  const { mutate, isPending } = trpc.page.updatePageBlob.useMutation({
    onSuccess: async () => {
      await utils.page.readPageAndBlob.invalidate({ pageId, siteId })
      await utils.page.readPage.invalidate({ pageId, siteId })
      await utils.page.getCategories.invalidate({ pageId, siteId })
      toast({
        status: "success",
        title: CHANGES_SAVED_PLEASE_PUBLISH_MESSAGE,
        ...BRIEF_TOAST_SETTINGS,
      })
    },
  })

  const metadataSchema = getLayoutPageSchema(previewPageState.layout)

  const filteredSchema =
    // For database layout, exclude the database field from metadata editing
    // since it's handled by the separate database editor (DatabaseEditorStateDrawer)
    previewPageState.layout === ISOMER_USABLE_PAGE_LAYOUTS.Database
      ? {
          ...metadataSchema,
          properties: Object.fromEntries(
            Object.entries(
              metadataSchema.properties as Record<string, unknown>,
            ).filter(([key]) => key !== "database"),
          ),
        }
      : metadataSchema

  const validateFn = ajv.compile<Static<typeof metadataSchema>>(filteredSchema)

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
          isDisabled={isPending}
          onBackClick={() => {
            if (!isEqual(previewPageState, savedPageState)) {
              onDiscardChangesModalOpen()
            } else {
              handleDiscardChanges()
            }
          }}
          label={
            HEADER_LABELS[savedPageState.layout] || "Edit header information"
          }
        />

        <ErrorProvider>
          <Box px="1.5rem" py="1rem" flex={1} overflow="auto">
            {savedPageState.layout === ISOMER_USABLE_PAGE_LAYOUTS.Index && (
              <Box pb="1rem">
                <Infobox
                  size="sm"
                  borderRadius="0.25rem"
                  border="1px solid"
                  borderColor="utility.feedback.info"
                >
                  <Text textStyle="body-2">
                    To change the page title, go to the folder and click on
                    "Folder Settings"
                  </Text>
                </Infobox>
              </Box>
            )}

            <Box mb="1rem">
              <FormBuilder<Static<typeof metadataSchema>>
                schema={filteredSchema}
                validateFn={validateFn}
                data={previewPageState.page}
                handleChange={(data) => handleChange(data)}
              />
            </Box>
          </Box>
          <Box
            bgColor="base.canvas.default"
            boxShadow="md"
            py="1.5rem"
            px="2rem"
          >
            <SaveButton isLoading={isPending} onClick={handleSaveChanges} />
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
