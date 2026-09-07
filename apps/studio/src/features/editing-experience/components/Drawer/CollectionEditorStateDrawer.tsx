/* oxlint-disable eslint/no-use-before-define, typescript/strict-boolean-expressions, unicorn/no-unsafe-type-assertion -- core cleanup deferred */
import type {
  CollectionPagePageProps,
  getLayoutPageSchema,
} from "@opengovsg/isomer-components"
import type { Static } from "@sinclair/typebox"
import { Box, Flex, Text, useDisclosure } from "@chakra-ui/react"
import { Button, Infobox, useToast } from "@opengovsg/design-system-react"
import {
  getScopedSchema,
  ISOMER_USABLE_PAGE_LAYOUTS,
} from "@opengovsg/isomer-components"
import { isEmpty, isEqual } from "lodash-es"
import posthogJs from "posthog-js"
import { useCallback, useMemo } from "react"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useCanManageCollectionFilters } from "~/features/editing-experience/hooks/canManageCollectionFilters"
import { useMe } from "~/features/me/api"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trackEvent, triggerCollectionTagCsatSurveyOnce } from "~/lib/intercom"
import { ajv } from "~/utils/ajv"
import { trpc } from "~/utils/trpc"
import {
  hasNonEmptyString,
  isDefinedNumber,
  isNullableBooleanTrue,
  isNonEmptyArray,
} from "~/utils/truthiness"

import { pageSchema } from "../../schema"
import {
  COLLECTION_DISPLAY_SAVED_MESSAGE,
  FILTER_SAVED_MESSAGE,
} from "../constants"
import { DiscardChangesModal } from "../DiscardChangesModal"
import { ErrorProvider, useBuilderErrors } from "../form-builder/ErrorProvider"
import FormBuilder from "../form-builder/FormBuilder"
import { DrawerHeader } from "./DrawerHeader"

const CollectionEditorStateDrawer = (): React.ReactNode => {
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

  const { me } = useMe()
  const canManageFilters = useCanManageCollectionFilters()
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
      posthogJs.capture("page_changes_saved", { site_id: siteId })
      await utils.page.readPageAndBlob.invalidate({ pageId, siteId })
      await utils.page.readPage.invalidate({ pageId, siteId })
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
    if (canManageFilters) {
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
  }, [drawerStateType, canManageFilters])

  const metadataSchema = useMemo(
    () =>
      getScopedSchema({
        layout: ISOMER_USABLE_PAGE_LAYOUTS.Collection,
        scope: "page",
        ...schemaFields,
      }),
    [schemaFields],
  )
  const validateFn = useMemo(
    () =>
      ajv.compile<Static<ReturnType<typeof getLayoutPageSchema>>>(
        metadataSchema,
      ),
    [metadataSchema],
  )

  const handleSaveChanges = useCallback(() => {
    // SAFETY: editor drawer state is narrowed to the active layout-specific page shape
    const hadNoTagsBefore = !isDefinedNumber(
      savedPageState.page as CollectionPagePageProps,
    ).tagCategories?.length
    // SAFETY: editor drawer state is narrowed to the active layout-specific page shape
    const hasTagsNow = !!isDefinedNumber(
      previewPageState.page as CollectionPagePageProps,
    ).tagCategories?.length

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
          if (hadNoTagsBefore && hasTagsNow) {
            trackEvent("first_tag_added")
            triggerCollectionTagCsatSurveyOnce({ userId: me.id })
          }
        },
      },
    )
  }, [
    mutate,
    pageId,
    previewPageState,
    savedPageState,
    setDrawerState,
    setSavedPageState,
    siteId,
    me.id,
  ])

  const handleChange = (
    data: Static<ReturnType<typeof getLayoutPageSchema>>,
  ) => {
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
            if (isEqual(previewPageState, savedPageState)) {
              handleDiscardChanges()
            } else {
              onDiscardChangesModalOpen()
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
                    To change this Collection&apos;s title, go back to the
                    Collection folder view and click on &apos;Collection
                    settings&apos;.
                  </Text>
                </Infobox>
              </Box>
            )}

            <Box mb="1rem">
              <FormBuilder<Static<typeof metadataSchema>>
                schema={metadataSchema}
                validateFn={validateFn}
                data={previewPageState.page}
                handleChange={(data) => {
                  // @ts-expect-error FormBuilder data matches collection page schema at runtime.
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
        if (!isEmpty(errors)) {
          return
        }
        onClick()
      }}
    >
      Save changes
    </Button>
  )
}

export default CollectionEditorStateDrawer
