import type { Static } from "@sinclair/typebox"
import {
  Box,
  TabList,
  TabPanel,
  TabPanels,
  Text,
  useDisclosure,
  useTheme,
} from "@chakra-ui/react"
import { Tab, Tabs } from "@opengovsg/design-system-react"
import { getLayoutPageSchema } from "@opengovsg/isomer-components"

import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { ajv } from "~/utils/ajv"
import { DiscardChangesModal } from "./DiscardChangesModal"
import { ErrorProvider } from "./form-builder/ErrorProvider"
import FormBuilder from "./form-builder/FormBuilder"

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
    // setSavedPageState,
    previewPageState,
    setPreviewPageState,
  } = useEditorDrawerContext()

  const metadataSchema = getLayoutPageSchema(previewPageState.layout)
  const validateFn = ajv.compile<Static<typeof metadataSchema>>(metadataSchema)

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
                Manage categories
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
      </ErrorProvider>
    </>
  )
}
