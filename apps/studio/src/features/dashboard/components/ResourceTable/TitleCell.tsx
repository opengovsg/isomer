import { useMemo } from "react"
import NextLink from "next/link"
import { HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { BiFileBlank, BiFolder } from "react-icons/bi"

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

  return (
    <HStack align="center" spacing="0.625rem">
      <Icon
        fontSize="1.25rem"
        as={type === "Page" ? BiFileBlank : BiFolder}
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
