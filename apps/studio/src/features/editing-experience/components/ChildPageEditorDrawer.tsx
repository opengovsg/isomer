import type {
  IndexPageSchema,
  IsomerSchema,
} from "@opengovsg/isomer-components"
import type { Static } from "@sinclair/typebox"
import { useCallback } from "react"
import { Box, Flex, useDisclosure } from "@chakra-ui/react"
import { Button, useToast } from "@opengovsg/design-system-react"
import { getChildpageSchema } from "@opengovsg/isomer-components"
import Ajv from "ajv"
import isEmpty from "lodash/isEmpty"
import isEqual from "lodash/isEqual"

import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"
import { editPageSchema } from "../schema"
import { CHANGES_SAVED_PLEASE_PUBLISH_MESSAGE } from "./constants"
import { DiscardChangesModal } from "./DiscardChangesModal"
import { DrawerHeader } from "./Drawer/DrawerHeader"
import { ErrorProvider, useBuilderErrors } from "./form-builder/ErrorProvider"
import FormBuilder from "./form-builder/FormBuilder"

const ajv = new Ajv({ strict: false, logger: false })

// NOTE: by the time we display this drawer,
// the only allowed `layout` type shold be `index`.
// This invariant is upheld in `RootStateDrawer`,
// where we only show the fixed block that triggers this drawer
// when the `layout` of the `page` is `index`
const narrowToIndex = (
  page: Omit<IsomerSchema, "version">,
): page is Static<typeof IndexPageSchema> => {
  return page.layout === "index"
}

export default function ChildPageEditorDrawer(): JSX.Element {
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

  if (!narrowToIndex(previewPageState)) {
    throw new Error(
      "Expected to find an index page, but this page does not have the required layout!",
    )
  }

  const toast = useToast()

  const schema = getChildpageSchema()
  const validateFn = ajv.compile<Static<typeof schema>>(schema)

  const { pageId, siteId } = useQueryParse(editPageSchema)
  const utils = trpc.useUtils()
  const { mutate, isLoading } = trpc.page.updatePageBlob.useMutation({
    onSuccess: async () => {
      await utils.page.readPageAndBlob.invalidate({ pageId, siteId })
      await utils.page.readPage.invalidate({ pageId, siteId })
      toast({
        title: CHANGES_SAVED_PLEASE_PUBLISH_MESSAGE,
        ...BRIEF_TOAST_SETTINGS,
      })
    },
  })

  const handleSaveChanges = useCallback(() => {
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
    currActiveIdx,
    mutate,
    pageId,
    previewPageState,
    setDrawerState,
    setPreviewPageState,
    setSavedPageState,
    siteId,
    toast,
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
    (data: unknown) => {
      const newPageState = {
        ...previewPageState,
        childpages: data,
      }
      setPreviewPageState(newPageState as IsomerSchema)
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
          label="Edit child pages block"
        />

        <ErrorProvider>
          <Box px="1.5rem" py="1rem" flex={1} overflow="auto">
            <FormBuilder<Static<typeof schema>>
              schema={schema}
              validateFn={validateFn}
              data={previewPageState.childpages}
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
