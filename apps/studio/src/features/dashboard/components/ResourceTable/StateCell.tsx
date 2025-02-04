import { Text } from "@chakra-ui/react"
import { Badge, BadgeLeftIcon } from "@opengovsg/design-system-react"
import { BiSolidCircle } from "react-icons/bi"

import type { ResourceTableData } from "./types"

export type StateCellProps = Pick<ResourceTableData, "draftBlobId">

export const StateCell = ({ draftBlobId }: StateCellProps) => {
  if (!draftBlobId) return null
  return (
    <Badge size="xs" variant="clear" colorScheme="warning">
      <BadgeLeftIcon fontSize="0.5rem" as={BiSolidCircle} />
      <Text textStyle="legal" color="yellow.400">
        Draft
      </Text>
    </Badge>
  )
}
