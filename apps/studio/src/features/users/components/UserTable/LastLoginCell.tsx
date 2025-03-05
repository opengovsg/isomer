import { chakra, HStack, Text, Tooltip } from "@chakra-ui/react"
import { differenceInDays } from "date-fns"
import { RiInformationLine } from "react-icons/ri"

import type { UserTableData } from "./types"

const ChakraRiInformationLine = chakra(RiInformationLine)

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
      <Tooltip label="For security, remove users that haven't accessed Studio for more than 3 months.">
        <HStack gap="0.5rem">
          <Text textStyle="caption-2" color="utility.feedback.critical">
            More than 90 days ago
          </Text>
          <ChakraRiInformationLine color="utility.feedback.critical" />
        </HStack>
      </Tooltip>
    )
  }

  if (daysFromLastLogin === 0) {
    return <Text textStyle="caption-2">Today</Text>
  }

  return (
    <Text textStyle="caption-2">{`${daysFromLastLogin} ${daysFromLastLogin === 1 ? "day" : "days"} ago`}</Text>
  )
}
