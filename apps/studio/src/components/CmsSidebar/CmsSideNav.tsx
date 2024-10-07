import type { ButtonProps } from "@chakra-ui/react"
import NextLink from "next/link"
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
  Text,
} from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { BiData, BiFile, BiFolder, BiHomeAlt } from "react-icons/bi"
import { z } from "zod"

import { DirectorySidebar } from "~/features/dashboard/components/DirectorySidebar"
import { useQueryParse } from "~/hooks/useQueryParse"
import { isAllowedToHaveChildren } from "~/utils/resources"
import { trpc } from "~/utils/trpc"

interface CmsSideNavProps {
  siteId: string
}
export const CmsSideNav = ({ siteId }: CmsSideNavProps) => {
  return (
    <Flex flexDir="column" px="1.25rem" py="1.75rem" height="full">
      <DirectorySidebar siteId={siteId} />
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

const siteSchema = z.object({
  folderId: z.string().optional(),
  resourceId: z.string().optional(),
})

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

const getCurResource = ({
  resourceId: collectionId,
  folderId,
}: z.infer<typeof siteSchema>) => {
  // NOTE: the pages where this sidebar shows
  // only have a few possiblities:
  // 1. the root page with no resource id
  // 2. inside a folder at /[siteId]/[folderId]
  // 3. inside a collection at /[siteId]/[collectionId]
  if (collectionId) {
    return collectionId
  }

  if (folderId) return folderId

  return null
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
  const siteProps = useQueryParse(siteSchema)
  const isCurResourceActive = getCurResource(siteProps) === resourceId

  if (isLoading || !data) {
    return <Skeleton isLoaded={!isLoading} w="16rem" h="2.25rem" />
  }

  const urlType = getResourceType(resourceType)
  const { pages } = data

  const hasChildren = pages.some(({ items }) => items.length > 0)

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
                isActive={isCurResourceActive}
                href={
                  resourceType === ResourceType.RootPage
                    ? `/sites/${siteId}`
                    : `/sites/${siteId}/${urlType}/${resourceId}`
                }
              >
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
              {isAllowedToHaveChildren(resourceType) && hasChildren && (
                <AccordionButton
                  disabled={isLoading}
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
