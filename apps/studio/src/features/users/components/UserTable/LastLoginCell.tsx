import { chakra, HStack, Text, Tooltip } from "@chakra-ui/react"
import { RiInformationLine } from "react-icons/ri"

import type { UserTableData } from "./types"
import { daysFromLastLogin, formatDate } from "../../utils"

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

  if (daysFromLastLogin(lastLoginAt) > 90) {
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

  return <Text textStyle="caption-2">{formatDate(lastLoginAt)}</Text>
}
