import { Text } from "@chakra-ui/react"
import { Badge, BadgeLeftIcon } from "@opengovsg/design-system-react"
import { BiSolidCircle } from "react-icons/bi"

import type { ResourceTableData } from "./types"

export type StateCellProps = Pick<ResourceTableData, "draftBlobId">

export const StateBadge = ({ draftBlobId }: StateCellProps) => {
  const isPublished = !draftBlobId
  return (
    <Badge
      size="xs"
      variant="clear"
      colorScheme={isPublished ? "success" : "warning"}
    >
      <BadgeLeftIcon fontSize="0.5rem" as={BiSolidCircle} />
      <Text textStyle="legal" color={isPublished ? "green.600" : "yellow.400"}>
        {isPublished ? "Published" : "Draft"}
      </Text>
    </Badge>
  )
}

export const StateCell = ({ draftBlobId }: StateCellProps) => {
  return <StateBadge draftBlobId={draftBlobId} />
}
