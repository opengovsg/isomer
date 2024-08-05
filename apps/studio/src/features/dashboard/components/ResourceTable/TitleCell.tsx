import type { IconType } from "react-icons"
import { useMemo } from "react"
import NextLink from "next/link"
import { HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { BiData, BiFile, BiFileBlank, BiFolder, BiHome } from "react-icons/bi"

import type { ResourceTableData } from "./types"

export interface TitleCellProps
  extends Pick<ResourceTableData, "title" | "permalink" | "type" | "id"> {
  siteId: number
}

export const TitleCell = ({
  title,
  permalink,
  type,
  siteId,
  id,
}: TitleCellProps): JSX.Element => {
  const linkToResource = useMemo(() => {
    const resourceType = `${type.toLowerCase()}s`
    return {
      pathname: "/sites/[siteId]/[resourceType]/[id]",
      query: {
        siteId,
        resourceType,
        id,
      },
    }
  }, [id, siteId, type])

  const ResourceTypeIcon: IconType = useMemo(() => {
    switch (type) {
      case "RootPage":
        return BiHome
      case "Page":
        return BiFileBlank
      case "Folder":
        return BiFolder
      case "Collection":
        return BiData
      case "CollectionPage":
        return BiFile
    }
  }, [type])

  return (
    <HStack align="center" spacing="0.625rem">
      <Icon
        fontSize="1.25rem"
        as={ResourceTypeIcon}
        color="base.content.strong"
      />
      <VStack spacing="0.25rem" align="start">
        <Text
          as={NextLink}
          href={linkToResource}
          title={title}
          textStyle="subhead-2"
          noOfLines={1}
        >
          {title}
        </Text>
        <Text
          title={permalink}
          noOfLines={1}
          textStyle="caption-2"
          color="base.content.medium"
        >
          {permalink}
        </Text>
      </VStack>
    </HStack>
  )
}
