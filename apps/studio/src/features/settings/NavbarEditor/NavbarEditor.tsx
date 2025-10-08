import type { Static } from "@sinclair/typebox"
import {
  Box,
  HStack,
  Icon,
  Skeleton,
  Spacer,
  TabList,
  TabPanel,
  TabPanels,
  Text,
  useTheme,
  VStack,
} from "@chakra-ui/react"
import { Button, Tab, Tabs } from "@opengovsg/design-system-react"
import {
  NavbarAddonsSchema,
  NavbarItemsSchema,
} from "@opengovsg/isomer-components"
import { BiDirections } from "react-icons/bi"

import { ErrorProvider } from "~/features/editing-experience/components/form-builder/ErrorProvider"
import FormBuilder from "~/features/editing-experience/components/form-builder/FormBuilder"
import { ajv } from "~/utils/ajv"
import { trpc } from "~/utils/trpc"

const validateItemsFn =
  ajv.compile<Static<typeof NavbarItemsSchema>>(NavbarItemsSchema)
const validateAddonsFn =
  ajv.compile<Static<typeof NavbarAddonsSchema>>(NavbarAddonsSchema)

interface NavbarEditorProps {
  siteId: number
}

export const NavbarEditor = ({ siteId }: NavbarEditorProps) => {
  const theme = useTheme()

  const {
    data: navbar,
    isLoading,
    isError,
  } = trpc.site.getNavbar.useQuery({
    id: siteId,
  })

  const handleItemsChange = (data: Static<typeof NavbarItemsSchema>) => {
    console.log(data)
  }

  const handleAddonsChange = (data: Static<typeof NavbarAddonsSchema>) => {
    console.log(data)
  }

  if (isLoading || isError) {
    return <Skeleton h="full" w="full" />
  }

  return (
    <VStack
      py="1.5rem"
      h="100%"
      w="full"
      alignItems="start"
      position="relative"
    >
      {/* Header section */}
      <HStack px="2rem" gap="0.75rem" w="full">
        <Box
          aria-hidden
          bg="brand.secondary.100"
          borderRadius="0.375rem"
          p="0.5rem"
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

        <Button>Publish changes</Button>
      </HStack>

      <ErrorProvider>
        <Tabs
          w="full"
          display="flex"
          flexDir="column"
          flex={1}
          overflow="hidden"
          position="unset"
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
                  data={navbar?.content}
                  handleChange={handleItemsChange}
                />
              </Box>
            </TabPanel>

            <TabPanel>
              <Box px="1.5rem" pt="1rem" mb="1rem" h="full">
                <FormBuilder<Static<typeof NavbarAddonsSchema>>
                  schema={NavbarAddonsSchema}
                  validateFn={validateAddonsFn}
                  data={navbar?.content}
                  handleChange={handleAddonsChange}
                />
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </ErrorProvider>
    </VStack>
  )
}
