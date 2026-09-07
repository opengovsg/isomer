import type {
  DatabasePageSchemaType,
  IsomerSchema,
} from "@opengovsg/isomer-components"
import type { Static } from "@sinclair/typebox"
import { Box, Flex, useDisclosure } from "@chakra-ui/react"
import { Button, useToast } from "@opengovsg/design-system-react"
import {
  getScopedSchema,
  ISOMER_USABLE_PAGE_LAYOUTS,
} from "@opengovsg/isomer-components"
import { isEmpty, isEqual } from "lodash-es"
import posthog from "posthog-js"
import { useCallback } from "react"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useQueryParse } from "~/hooks/useQueryParse"
import { ajv } from "~/utils/ajv"
import { trpc } from "~/utils/trpc"

import { pageSchema } from "../../schema"
import { CHANGES_SAVED_PLEASE_PUBLISH_MESSAGE } from "../constants"
import { DiscardChangesModal } from "../DiscardChangesModal"
import { ErrorProvider, useBuilderErrors } from "../form-builder/ErrorProvider"
import FormBuilder from "../form-builder/FormBuilder"
import { DrawerHeader } from "./DrawerHeader"

const databasePageDatabaseSchema = getScopedSchema({
  layout: ISOMER_USABLE_PAGE_LAYOUTS.Database,
  scope: "page.database",
})

type DatabaseFormData = DatabasePageSchemaType["page"]["database"]

const validateFn = ajv.compile<DatabaseFormData>(databasePageDatabaseSchema)

const getDatabaseFormData = (
  pageState: IsomerSchema,
): DatabaseFormData | undefined => {
  if (pageState.layout !== ISOMER_USABLE_PAGE_LAYOUTS.Database) {
    return undefined
  }
  // SAFETY: layout check confirms database page shape.
  // @ts-expect-error IsomerSchema union is wider than DatabasePageSchemaType at compile time.
  return (pageState as DatabasePageSchemaType).page.database
}

const DatabaseEditorStateDrawer = (): React.ReactNode => {
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
      posthog.capture("page_changes_saved", { site_id: siteId })
      await utils.page.readPageAndBlob.invalidate({ pageId, siteId })
      await utils.page.readPage.invalidate({ pageId, siteId })
      toast({
        status: "success",
        title: CHANGES_SAVED_PLEASE_PUBLISH_MESSAGE,
        ...BRIEF_TOAST_SETTINGS,
      })
    },
  })

  const handleSaveChanges = useCallback(() => {
    setSavedPageState(previewPageState)
    mutate(
      {
        content: JSON.stringify(previewPageState),
        pageId,
        siteId,
      },
      {
        onSuccess: () => {
          setDrawerState({ state: "root" })
        },
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

  const handleChange = (data: DatabaseFormData) => {
    if (previewPageState.layout !== ISOMER_USABLE_PAGE_LAYOUTS.Database) {
      return
    }
    // SAFETY: layout check confirms database page shape.
    // @ts-expect-error IsomerSchema union is wider than DatabasePageSchemaType at compile time.
    const databasePageState = previewPageState as DatabasePageSchemaType

    const nextState = {
      ...databasePageState,
      page: {
        ...databasePageState.page,
        database: data,
      },
    }
    // SAFETY: nextState preserves database layout while updating nested form data.
    // @ts-expect-error updated database page remains a valid preview page state.
    setPreviewPageState(nextState as typeof previewPageState)
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
            if (isEqual(previewPageState, savedPageState)) {
              handleDiscardChanges()
            } else {
              onDiscardChangesModalOpen()
            }
          }}
          label="Edit database"
        />

        <ErrorProvider>
          <Box px="1.5rem" py="1rem" flex={1} overflow="auto">
            <Box mb="1rem">
              <FormBuilder<Static<typeof databasePageDatabaseSchema>>
                schema={databasePageDatabaseSchema}
                validateFn={validateFn}
                data={getDatabaseFormData(previewPageState)}
                handleChange={(data) => {
                  // @ts-expect-error FormBuilder data matches database form schema at runtime.
                  handleChange(data)
                }}
              />
            </Box>
          </Box>
          <Box
            bgColor="base.canvas.default"
            boxShadow="md"
            py="1.5rem"
            px="2rem"
          >
            <SaveButton onClick={handleSaveChanges} isLoading={isPending} />
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

export default DatabaseEditorStateDrawer
