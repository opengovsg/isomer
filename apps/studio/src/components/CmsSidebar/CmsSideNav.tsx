import { PropsWithChildren } from "react"
import NextLink from "next/link"
import { useRouter } from "next/router"
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  ButtonProps,
  Flex,
  Grid,
  GridItem,
  Icon,
  Spacer,
  Text,
} from "@chakra-ui/react"
import { GridProps } from "@chakra-ui/styled-system"
import { Button, Spinner } from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { BiData, BiFile, BiFolder, BiHomeAlt } from "react-icons/bi"

import { isAllowedToHaveChildren } from "~/utils/resources"
import { trpc } from "~/utils/trpc"

interface CmsSideNavProps {
  siteId: string
}
export const CmsSideNav = ({ siteId }: CmsSideNavProps) => {
  return (
    <Flex flexDir="column" px="1.25rem" py="1.75rem">
      <Box mt="4px">
        {/* TODO: update the resource id here */}
        <SideNavItem
          resourceId={null}
          permalink={"/"}
          siteId={siteId}
          resourceType="RootPage"
        />
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

const SideNavRow = ({ children, ...rest }: ButtonProps & { href: string }) => {
  return (
    <Button
      as={NextLink}
      data-group
      gap="0.25rem"
      w="full"
      variant="clear"
      pl="0.75rem"
      pr="0.5rem"
      py="0.38rem"
      justifyContent="flex-start"
      {...rest}
    >
      {children}
    </Button>
  )
}

const SideNavItem = ({
  resourceType,
  resourceId,
  permalink,
  isDisabled,
  siteId,
}: SideNavItemProps) => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    trpc.resource.getChildrenOf.useInfiniteQuery(
      {
        resourceId,
        siteId,
        limit: 25,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextOffset,
      },
    )

  const icon = ICON_MAPPINGS[resourceType]
  const router = useRouter()

  if (isLoading || !data) {
    return (
      <Flex align="center" height="2rem" pl="2.75rem" pr="1rem">
        <Spinner />
      </Flex>
    )
  }

  const urlType = getResourceType(resourceType)
  const { pages } = data

  return (
    <Accordion
      defaultIndex={resourceType === ResourceType.RootPage ? 0 : undefined}
      allowToggle
    >
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
            <Box pos="relative">
              {/* NOTE: required for focus ring */}
              <SideNavRow
                leftIcon={<Box w="1rem" />}
                href={
                  resourceType === ResourceType.RootPage
                    ? `/sites/${siteId}`
                    : `/sites/${siteId}/${urlType}/${resourceId}`
                }
              >
                {/* <AccordionButton */}
                {/*   boxSizing="border-box" */}
                {/*   disabled={isDisabled} */}
                {/*   borderRadius="0.25rem" */}
                {/*   _focusVisible={{ */}
                {/*     boxShadow: "none !important", */}
                {/*     outline: `2px solid var(--chakra-colors-utility-focus-default)`, */}
                {/*     outlineOffset: "0.125rem", */}
                {/*     _dark: { */}
                {/*       outline: `2px solid var(--chakra-colors-utility-focus-inverse)`, */}
                {/*     }, */}
                {/*   }} */}
                {/*   _hover={{ */}
                {/*     backgroundColor: "interaction.muted.main.hover", */}
                {/*   }} */}
                {/*   _active={{ */}
                {/*     backgroundColor: "interaction.muted.main.active", */}
                {/*     textColor: "interaction.main.default", */}
                {/*   }} */}
                {/*   onDoubleClick={async () => { */}
                {/*     const urlType = getResourceType(resourceType) */}
                {/*     if (resourceType === "RootPage") { */}
                {/*       return router.push({ */}
                {/*         pathname: "/sites/[siteId]", */}
                {/*         query: { */}
                {/*           siteId, */}
                {/*         }, */}
                {/*       }) */}
                {/*     } */}
                {/*     return router.push({ */}
                {/*       pathname: "/sites/[siteId]/[resourceType]/[id]", */}
                {/*       query: { */}
                {/*         siteId, */}
                {/*         resourceType: urlType, */}
                {/*         id: resourceId, */}
                {/*       }, */}
                {/*     }) */}
                {/*   }} */}
                {/* > */}
                {/*   <Flex */}
                {/*     w="full" */}
                {/*     color="base.content.default" */}
                {/*     alignItems="center" */}
                {/*   > */}
                {/*     {isAllowedToHaveChildren(resourceType) ? ( */}
                {/*       <AccordionIcon */}
                {/*         mr="0.25rem" */}
                {/*         color="interaction.support.unselected" */}
                {/*       /> */}
                {/*     ) : ( */}
                {/*       <Box w="1.5rem"></Box> */}
                {/*     )} */}
                {/*     <Icon as={icon} flexShrink={0} /> */}
                {/*     <Text */}
                {/*       noOfLines={1} */}
                {/*       textAlign="left" */}
                {/*       textStyle="subhead-2" */}
                {/*       ml="0.5rem" */}
                {/*     > */}
                {/*       {permalink} */}
                {/*     </Text> */}
                {/*     <Spacer /> */}
                {/*     {resourceType === ResourceType.RootPage && ( */}
                {/*       <Text */}
                {/*         color="base.content.medium" */}
                {/*         textTransform="uppercase" */}
                {/*         textStyle="caption-1" */}
                {/*         overflow="hidden" */}
                {/*         textOverflow="ellipsis" */}
                {/*         whiteSpace="nowrap" */}
                {/*       > */}
                {/*         Home */}
                {/*       </Text> */}
                {/*     )} */}
                {/*   </Flex> */}
                {/* </AccordionButton> */}
                <Icon fill="base.content.default" as={icon} flexShrink={0} />
                <Text
                  ml="0.25rem"
                  noOfLines={1}
                  textColor="base.content.default"
                  textAlign="left"
                  textStyle="subhead-2"
                >
                  {permalink}
                </Text>
              </SideNavRow>
              {isAllowedToHaveChildren(resourceType) && (
                <AccordionButton
                  pos="absolute"
                  w="fit-content"
                  p={0}
                  left="0.75rem"
                  top="0.75rem"
                >
                  <AccordionIcon color="interaction.support.unselected" />
                </AccordionButton>
              )}
              {isExpanded && (
                <AccordionPanel p="0" pl="1.25rem">
                  {pages.map(({ items }) => {
                    return items.map((props) => (
                      <SideNavItem
                        key={props.id}
                        resourceType={props.type}
                        siteId={siteId}
                        resourceId={props.id}
                        permalink={props.permalink}
                      />
                    ))
                  })}
                  {hasNextPage && (
                    <Button
                      variant="link"
                      pl="2.75rem"
                      size="xs"
                      isLoading={isFetchingNextPage}
                      onClick={() => fetchNextPage()}
                    >
                      Load more
                    </Button>
                  )}
                </AccordionPanel>
              )}
            </Box>
          )
        }}
      </AccordionItem>
    </Accordion>
  )
}
