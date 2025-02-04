import { Text, VStack } from "@chakra-ui/react"

import type { ResourceTableData } from "./types"

export type PublishedInfoCellProps = Pick<
  ResourceTableData,
  "publishedAt" | "publisherEmail"
>

export const PublishedInfoCell = ({
  publishedAt,
  publisherEmail,
}: PublishedInfoCellProps) => {
  if (!publishedAt || !publisherEmail) return null
  return (
    <VStack align="flex-start" gap="0.25rem">
      <Text textStyle="caption-2">{publisherEmail}</Text>
      <Text textStyle="caption-2" color="base.content.medium">
        {publishedAt.toLocaleDateString()}
      </Text>
    </VStack>
  )
}
