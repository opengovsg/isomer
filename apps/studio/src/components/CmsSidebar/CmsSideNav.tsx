import { Suspense } from "react"
import { useRouter } from "next/router"
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Flex,
  Icon,
  Skeleton,
  Spacer,
  Text,
  VStack,
} from "@chakra-ui/react"
import { Menu } from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { BiData, BiFile, BiFolder, BiHomeAlt } from "react-icons/bi"

import { isAllowedToHaveChildren } from "~/utils/resources"
import { trpc } from "~/utils/trpc"

interface CmsSideNavProps {
  siteId: string
}
export const CmsSideNav = ({ siteId }: CmsSideNavProps) => {
  return (
    <Flex flexDir="column">
      <VStack
        align="flex-start"
        spacing="1.5rem"
        pt="2rem"
        px="1.25rem"
        pb="0.75rem"
        boxShadow="sm"
      >
        <Menu>
          <Menu.Button w="full" variant="outline">
            Create new
          </Menu.Button>
          <Menu.List>
            <Menu.Item>Create new page</Menu.Item>
            <Menu.Item>Create new folder</Menu.Item>
            <Menu.Item>Create new collection</Menu.Item>
          </Menu.List>
        </Menu>
        <Text textStyle="caption-1">Site content</Text>
      </VStack>
      <Box mt="4px" px="1.25rem">
        {/* TODO: update the resource id here */}
        <Suspense fallback={<Skeleton />}>
          <SideNavItem
            resourceId={null}
            permalink={"/"}
            siteId={siteId}
            resourceType="RootPage"
          />
        </Suspense>
      </Box>
    </Flex>
  )
}

const ICON_MAPPINGS = {
  [ResourceType.Page]: BiFile,
  [ResourceType.Folder]: BiFolder,
  [ResourceType.Collection]: BiData,
  [ResourceType.CollectionPage]: BiFile,
  [ResourceType.RootPage]: BiHomeAlt,
}

interface SideNavItemProps {
  permalink: string
  resourceId: string | null
  resourceType: ResourceType
  isDisabled?: boolean
  siteId: string
}

const getResourceType = (
  resourceType: ResourceType,
): "pages" | "folders" | "collections" => {
  if (
    resourceType === ResourceType.Page ||
    resourceType === ResourceType.CollectionPage
  ) {
    return "pages"
  }

  if (resourceType === ResourceType.Collection) {
    return "collections"
  }

  return "folders"
}

const SideNavItem = ({
  resourceType,
  resourceId,
  permalink,
  isDisabled,
  siteId,
}: SideNavItemProps) => {
  const [children] = trpc.resource.getChildrenOf.useSuspenseQuery({
    resourceId,
  })

  const icon = ICON_MAPPINGS[resourceType]
  const router = useRouter()

  return (
    <Accordion allowToggle>
      <AccordionItem
        _disabled={{
          textColor: "interaction.support.disabled-content",
        }}
        isDisabled={isDisabled}
        border="none"
      >
        {/* NOTE: This is to lazy load on expand  */}
        {/* so that we don't issue multiple db reads on load */}
        {({ isExpanded }) => {
          return (
            <>
              {/* NOTE: required for focus ring */}
              <Box m="4px">
                <AccordionButton
                  boxSizing="border-box"
                  disabled={isDisabled}
                  borderRadius="0.25rem"
                  _focusVisible={{
                    boxShadow: "none !important",
                    outline: `2px solid var(--chakra-colors-utility-focus-default)`,
                    outlineOffset: "0.125rem",
                    _dark: {
                      outline: `2px solid var(--chakra-colors-utility-focus-inverse)`,
                    },
                  }}
                  _hover={{
                    backgroundColor: "interaction.muted.main.hover",
                  }}
                  _active={{
                    backgroundColor: "interaction.muted.main.active",
                    textColor: "interaction.main.default",
                  }}
                  onDoubleClick={async () => {
                    const urlType = getResourceType(resourceType)
                    if (resourceType === "RootPage") {
                      return router.push({
                        pathname: "/sites/[siteId]",
                        query: {
                          siteId,
                        },
                      })
                    }
                    return router.push({
                      pathname: "/sites/[siteId]/[resourceType]/[id]",
                      query: {
                        siteId,
                        resourceType: urlType,
                        id: resourceId,
                      },
                    })
                  }}
                >
                  <Flex
                    w="full"
                    color="base.content.default"
                    alignItems="center"
                  >
                    {isAllowedToHaveChildren(resourceType) ? (
                      <AccordionIcon
                        mr="0.25rem"
                        color="interaction.support.unselected"
                      />
                    ) : (
                      <Box w="1.5rem"></Box>
                    )}
                    <Icon as={icon} flexShrink={0} />
                    <Text
                      noOfLines={1}
                      textAlign="left"
                      textStyle="caption-1"
                      ml="0.5rem"
                    >
                      {permalink}
                    </Text>
                    <Spacer />
                    {resourceType === ResourceType.RootPage && (
                      <Text
                        color="base.content.medium"
                        textTransform="uppercase"
                        textStyle="caption-1"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                      >
                        Home
                      </Text>
                    )}
                  </Flex>
                </AccordionButton>
              </Box>
              <Suspense fallback={<Skeleton />}>
                {isExpanded && (
                  <AccordionPanel p="0" pl="1.25rem">
                    {/* NOTE: The root page would already be on top level  */}
                    {/* so we don't need to display it again here  */}
                    {children
                      .filter(({ type }) => {
                        return type !== ResourceType.RootPage
                      })
                      .map((props) => {
                        return (
                          <SideNavItem
                            resourceType={props.type}
                            siteId={siteId}
                            resourceId={props.id}
                            permalink={props.permalink}
                          />
                        )
                      })}
                  </AccordionPanel>
                )}
              </Suspense>
            </>
          )
        }}
      </AccordionItem>
    </Accordion>
  )
}
