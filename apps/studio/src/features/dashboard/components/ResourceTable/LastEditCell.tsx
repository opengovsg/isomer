import { Text, VStack } from "@chakra-ui/react"
import { formatDistance } from "date-fns"

import type { ResourceTableData } from "./types"

export interface LastEditCellProps {
  date: ResourceTableData["lastEditDate"]
  email: ResourceTableData["lastEditUser"]
}

export const LastEditCell = ({
  date,
  email,
}: LastEditCellProps): JSX.Element => {
  if (date === "folder") {
    return (
      <Text as="span" textStyle="caption-2">
        -
      </Text>
    )
  }

  return (
    <VStack align="start" spacing="0.25rem" textStyle="caption-2">
      <Text title={email} noOfLines={1} color="base.content.strong">
        {email}
      </Text>
      <Text
        title={date.toLocaleString()}
        noOfLines={1}
        color="base.content.medium"
      >
        {formatDistance(date, new Date(), { addSuffix: true })}
      </Text>
    </VStack>
  )
}
