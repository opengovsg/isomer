import type { NavbarSchemaType } from "@opengovsg/isomer-components"
import type { Static } from "@sinclair/typebox"
import type { Dispatch, SetStateAction } from "react"
import { useCallback, useMemo } from "react"
import {
  Box,
  HStack,
  Icon,
  Spacer,
  TabList,
  TabPanel,
  TabPanels,
  Text,
  Tooltip,
  useTheme,
  VStack,
} from "@chakra-ui/react"
import { Button, Tab, Tabs } from "@opengovsg/design-system-react"
import {
  NavbarAddonsSchema,
  NavbarItemsSchema,
} from "@opengovsg/isomer-components"
import isEmpty from "lodash/isEmpty"
import isEqual from "lodash/isEqual"
import { BiDirections } from "react-icons/bi"

import {
  ErrorProvider,
  useBuilderErrors,
} from "~/features/editing-experience/components/form-builder/ErrorProvider"
import FormBuilder from "~/features/editing-experience/components/form-builder/FormBuilder"
import { ajv } from "~/utils/ajv"

const validateItemsFn =
  ajv.compile<Static<typeof NavbarItemsSchema>>(NavbarItemsSchema)
const validateAddonsFn =
  ajv.compile<Static<typeof NavbarAddonsSchema>>(NavbarAddonsSchema)

interface NavbarEditorProps {
  savedNavbarState: NavbarSchemaType
  previewNavbarState?: NavbarSchemaType
  setPreviewNavbarState: Dispatch<SetStateAction<NavbarSchemaType | undefined>>
  onSave: (data?: NavbarSchemaType) => void
  isSaving: boolean
}

export const NavbarEditor = ({
  savedNavbarState,
  previewNavbarState,
  setPreviewNavbarState,
  onSave,
  isSaving,
}: NavbarEditorProps) => {
  const theme = useTheme()
  const isDirty = useMemo(() => {
    return !isEqual(previewNavbarState, savedNavbarState)
  }, [previewNavbarState, savedNavbarState])

  const handleItemsChange = useCallback(
    (data: Static<typeof NavbarItemsSchema>) => {
      const updatedData = { ...previewNavbarState, ...data }

      if (isEqual(previewNavbarState, updatedData)) {
        return
      }

      setPreviewNavbarState(updatedData)
    },
    [previewNavbarState, setPreviewNavbarState],
  )

  const handleAddonsChange = useCallback(
    (data: Static<typeof NavbarAddonsSchema>) => {
      const updatedData = {
        items: [...(previewNavbarState?.items ?? [])],
        ...data,
      }

      if (isEqual(previewNavbarState, updatedData)) {
        return
      }

      setPreviewNavbarState(updatedData)
    },
    [previewNavbarState, setPreviewNavbarState],
  )

  const handleSave = () => {
    onSave(previewNavbarState)
  }

  return (
    <ErrorProvider>
      <VStack
        py="1.5rem"
        h="100%"
        w="full"
        alignItems="start"
        position="relative"
        gap="1.5rem"
      >
        {/* Header section */}
        <HStack px="2rem" gap="0.75rem" w="full">
          <Box
            aria-hidden
            bg="brand.secondary.100"
            borderRadius="0.375rem"
            p="0.5rem"
            lineHeight="0.75rem"
          >
            <Icon as={BiDirections} />
          </Box>

          <Text
            as="h2"
            textStyle="h3"
            textColor="base.content.default"
            textOverflow="ellipsis"
          >
            Navigation menu
          </Text>

          <Spacer />

          <PublishButton
            isDirty={isDirty}
            isSaving={isSaving}
            onClick={handleSave}
          />
        </HStack>

        <Tabs
          w="full"
          display="flex"
          flexDir="column"
          flex={1}
          overflow="hidden"
          position="unset"
          size="sm"
        >
          <TabList
            // This is to allow the bottom border to overlap with the one coming
            // from the Tab component
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            background={`linear-gradient(${theme.colors.base.divider.medium},${theme.colors.base.divider.medium}) bottom/100% 2px no-repeat`}
            boxSizing="border-box"
            px="2rem"
          >
            <Tab mx={0}>Menu Links</Tab>
            <Tab mx={0}>Customise</Tab>
          </TabList>

          <TabPanels px="0.5rem" flex={1} overflowY="auto">
            <TabPanel>
              <Box px="1.5rem" mb="1rem" h="full">
                <FormBuilder<Static<typeof NavbarItemsSchema>>
                  schema={NavbarItemsSchema}
                  validateFn={validateItemsFn}
                  data={previewNavbarState}
                  handleChange={handleItemsChange}
                />
              </Box>
            </TabPanel>

            <TabPanel>
              <Box px="1.5rem" pt="1rem" mb="1rem" h="full">
                <FormBuilder<Static<typeof NavbarAddonsSchema>>
                  schema={NavbarAddonsSchema}
                  validateFn={validateAddonsFn}
                  data={previewNavbarState}
                  handleChange={handleAddonsChange}
                />
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </ErrorProvider>
  )
}

const PublishButton = ({
  isDirty,
  isSaving,
  onClick,
}: {
  isDirty: boolean
  isSaving: boolean
  onClick: () => void
}) => {
  const { errors } = useBuilderErrors()
  const isSchemaValid = isEmpty(errors)

  return (
    <Tooltip
      label={
        !isSchemaValid
          ? "There are errors in your navigation menu. Fix them before publishing."
          : undefined
      }
      hasArrow
    >
      <Button
        size="xs"
        onClick={onClick}
        isLoading={isSaving}
        isDisabled={!isDirty || !isSchemaValid}
      >
        Publish changes
      </Button>
    </Tooltip>
  )
}
