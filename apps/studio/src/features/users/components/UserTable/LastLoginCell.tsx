import { HStack, Text, Tooltip } from "@chakra-ui/react"
import { differenceInDays, format } from "date-fns"
import { RiInformationLine } from "react-icons/ri"

import type { UserTableData } from "./types"

type LastLoginCellProps = Pick<UserTableData, "lastLoginAt">

export const LastLoginCell = ({ lastLoginAt }: LastLoginCellProps) => {
  if (!lastLoginAt) {
    return (
      <Text textStyle="caption-2" color="interaction.support.disabled-content">
        Waiting to accept invite
      </Text>
    )
  }

  const daysFromLastLogin = differenceInDays(new Date(), lastLoginAt)
  if (daysFromLastLogin > 90) {
    return (
      <HStack gap="0.5rem">
        <Text textStyle="caption-2" color="utility.feedback.critical">
          More than 90 days ago
        </Text>
        <Tooltip label="For security, remove users that haven’t accessed Studio for more than 3 months.">
          <RiInformationLine fill="utility.feedback.critical" />
        </Tooltip>
      </HStack>
    )
  }

  return <Text textStyle="caption-2">{format(lastLoginAt, "MMM d, yyyy")}</Text>
}
