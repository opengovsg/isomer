import { HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { BiFileBlank, BiFolder } from "react-icons/bi"

import type { ResourceTableData } from "./types"

export type TitleCellProps = Pick<
  ResourceTableData,
  "title" | "permalink" | "type"
>

export const TitleCell = ({
  title,
  permalink,
  type,
}: TitleCellProps): JSX.Element => {
  return (
    <HStack align="center" spacing="0.625rem">
      <Icon
        fontSize="1.25rem"
        as={type === "Page" ? BiFileBlank : BiFolder}
        color="base.content.strong"
      />
      <VStack spacing="0.25rem" align="start">
        <Text title={title ?? ""} textStyle="subhead-2" noOfLines={1}>
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
