import type { getLayoutPageSchema } from "@opengovsg/isomer-components"
import type { Static } from "@sinclair/typebox"
import {
  Box,
  Flex,
  TabList,
  TabPanel,
  TabPanels,
  Text,
  useDisclosure,
  useTheme,
} from "@chakra-ui/react"
import { Button, Tab, Tabs, useToast } from "@opengovsg/design-system-react"
import {
  getScopedSchema,
  ISOMER_USABLE_PAGE_LAYOUTS,
} from "@opengovsg/isomer-components"
import isEmpty from "lodash/isEmpty"
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

export default function CollectionEditorStateDrawer(): JSX.Element {
  const theme = useTheme()
  const {
    isOpen: isDiscardChangesModalOpen,
    // onOpen: onDiscardChangesModalOpen,
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

  const metadataSchema = getScopedSchema({
    layout: ISOMER_USABLE_PAGE_LAYOUTS.Collection,
    scope: "page",
    exclude: ["tagCategories", "tags"],
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
        <ErrorProvider>
          <Tabs
            w="full"
            h="full"
            display="flex"
            flexDir="column"
            flex={1}
            overflow="hidden"
            position="relative"
            size="sm"
          >
            <TabList
              // This is to allow the bottom border to overlap with the one coming
              // from the Tab component
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              background={`linear-gradient(${theme.colors.base.divider.medium},${theme.colors.base.divider.medium}) bottom/100% 2px no-repeat`}
              bgColor="utility.ui"
              boxSizing="border-box"
              paddingInline="1.5rem"
              pt="1rem"
            >
              <Tab mx={0}>
                <Text textStyle="subhead-1" textTransform="capitalize">
                  Customise display
                </Text>
              </Tab>
              <Tab mx={0}>
                <Text textStyle="subhead-1" textTransform="capitalize">
                  Manage filters
                </Text>
              </Tab>
            </TabList>

            <TabPanels px="1.5rem" flex={1} overflowY="auto">
              <TabPanel>
                <Box py="1.25rem" mb="1rem" h="full">
                  <FormBuilder<Static<typeof metadataSchema>>
                    schema={metadataSchema}
                    validateFn={validateFn}
                    data={previewPageState.page}
                    handleChange={(data) => handleChange(data)}
                  />
                </Box>
              </TabPanel>

              <TabPanel>
                <Box mt="1.25rem" mb="1rem" h="full">
                  Placeholder for manage categories form
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>

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
