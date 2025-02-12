import { Text, VStack } from "@chakra-ui/react"
import {
  format,
  formatDistanceToNow,
  isWithinInterval,
  subDays,
} from "date-fns"

import type { ResourceTableData } from "./types"

export const formatDate = (date: Date) => {
  const isRecent = isWithinInterval(date, {
    start: subDays(new Date(), 7),
    end: new Date(),
  })

  if (isRecent) {
    return formatDistanceToNow(date, { addSuffix: true })
  }

  return format(date, "MMM d, yyyy")
}

export type PublishedInfoCellProps = Pick<
  ResourceTableData,
  "publishedAt" | "publisherEmail"
>

export const PublishedInfoCell = ({
  publishedAt,
  publisherEmail,
}: PublishedInfoCellProps) => {
  if (!publishedAt) return null
  return (
    <VStack align="flex-start" gap="0.25rem">
      <Text textStyle="caption-2">{publisherEmail}</Text>
      <Text textStyle="caption-2" color="base.content.medium">
        {formatDate(publishedAt)}
      </Text>
    </VStack>
  )
}
