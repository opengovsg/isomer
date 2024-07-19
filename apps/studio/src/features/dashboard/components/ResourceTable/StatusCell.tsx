import { Text } from "@chakra-ui/react"
import { Badge, BadgeLeftIcon } from "@opengovsg/design-system-react"
import { BiSolidCircle } from "react-icons/bi"

import type { ResourceTableData } from "./types"

export interface StatusCellProps {
  status: ResourceTableData["status"]
}

export const StatusCell = ({ status }: StatusCellProps): JSX.Element => {
  switch (status) {
    case "folder":
      return (
        <Text as="span" textStyle="caption-2">
          -
        </Text>
      )
    case "published":
      return (
        <Badge colorScheme="success" variant="subtle" rounded="full">
          <BadgeLeftIcon
            marginEnd="0.5rem"
            fontSize="0.5rem"
            as={BiSolidCircle}
          />
          Published
        </Badge>
      )
    case "draft":
      return (
        <Badge colorScheme="warning" variant="subtle" rounded="full">
          <BadgeLeftIcon
            marginEnd="0.5rem"
            fontSize="0.5rem"
            as={BiSolidCircle}
          />
          Draft
        </Badge>
      )
  }
}
