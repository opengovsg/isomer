import type { getLayoutPageSchema } from "@opengovsg/isomer-components"
import type { Static } from "@sinclair/typebox"
import { Box, Flex, Text, useDisclosure } from "@chakra-ui/react"
import { Button, Infobox, useToast } from "@opengovsg/design-system-react"
import {
  getScopedSchema,
  ISOMER_USABLE_PAGE_LAYOUTS,
} from "@opengovsg/isomer-components"
import { isEmpty, isEqual } from "lodash-es"
import { useCallback, useMemo } from "react"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { useQueryParse } from "~/hooks/useQueryParse"
import { ajv } from "~/utils/ajv"
import { trpc } from "~/utils/trpc"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

import { pageSchema } from "../../schema"
import {
  COLLECTION_DISPLAY_SAVED_MESSAGE,
  FILTER_SAVED_MESSAGE,
} from "../constants"
import { DiscardChangesModal } from "../DiscardChangesModal"
import { ErrorProvider, useBuilderErrors } from "../form-builder/ErrorProvider"
import FormBuilder from "../form-builder/FormBuilder"
import { DrawerHeader } from "./DrawerHeader"

export default function CollectionEditorStateDrawer(): JSX.Element {
  const {
    isOpen: isDiscardChangesModalOpen,
    onOpen: onDiscardChangesModalOpen,
    onClose: onDiscardChangesModalClose,
  } = useDisclosure()
  const {
    drawerState,
    setDrawerState,
    savedPageState,
    setSavedPageState,
    previewPageState,
    setPreviewPageState,
  } = useEditorDrawerContext()

  const { isAdmin: isUserIsomerAdmin } = useIsUserIsomerAdmin({
    roles: [IsomerAdminRole.Core, IsomerAdminRole.Migrator],
  })
  const { pageId, siteId } = useQueryParse(pageSchema)
  const toast = useToast()
  const utils = trpc.useUtils()

  const drawerStateType = useMemo(() => {
    if (drawerState.state !== "collectionEditor") {
      return "display"
    }
    return drawerState.type
  }, [drawerState])

  const { mutate, isPending } = trpc.page.updatePageBlob.useMutation({
    onSuccess: async () => {
      await utils.page.readPageAndBlob.invalidate({ pageId, siteId })
      await utils.page.readPage.invalidate({ pageId, siteId })
      await utils.page.getCategories.invalidate({ pageId, siteId })
      toast({
        status: "success",
        title:
          drawerStateType === "filter"
            ? FILTER_SAVED_MESSAGE
            : COLLECTION_DISPLAY_SAVED_MESSAGE,
        ...BRIEF_TOAST_SETTINGS,
      })
    },
  })

  const schemaFields = useMemo(() => {
    if (isUserIsomerAdmin) {
      return drawerStateType === "display"
        ? {
            exclude: ["tagCategories", "tags"],
          }
        : {
            include: ["tagCategories", "tags"],
          }
    }
    return {
      exclude: ["tagCategories", "tags"],
    }
  }, [drawerStateType, isUserIsomerAdmin])

  const metadataSchema = getScopedSchema({
    layout: ISOMER_USABLE_PAGE_LAYOUTS.Collection,
    scope: "page",
    ...schemaFields,
  })
  const validateFn =
    ajv.compile<Static<ReturnType<typeof getLayoutPageSchema>>>(metadataSchema)

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
    if (validateFn(data)) {
      setPreviewPageState({
        ...previewPageState,
        page: data,
      })
    }
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
            drawerStateType === "display"
              ? "Collection display"
              : "Manage filters"
          }
        />

        <ErrorProvider>
          <Box px="1.5rem" py="1rem" flex={1} overflow="auto">
            {drawerStateType === "display" && (
              <Box pb="1rem">
                <Infobox
                  size="sm"
                  borderRadius="0.25rem"
                  border="1px solid"
                  borderColor="utility.feedback.info"
                >
                  <Text textStyle="body-2">
                    To change this Collection's title, go back to the Collection
                    folder view and click on 'Collection settings'.
                  </Text>
                </Infobox>
              </Box>
            )}

            <Box mb="1rem">
              <FormBuilder<Static<typeof metadataSchema>>
                schema={metadataSchema}
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
      onClick={() => {
        if (!isEmpty(errors)) return
        onClick()
      }}
    >
      Save changes
    </Button>
  )
}
