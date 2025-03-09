import { chakra, HStack, Text, Tooltip } from "@chakra-ui/react"
import { RiInformationLine } from "react-icons/ri"

import type { UserTableData } from "./types"
import { getDaysFromLastLogin, getLastLoginText } from "~/features/users/utils"

const ChakraRiInformationLine = chakra(RiInformationLine)

type LastLoginCellProps = Pick<UserTableData, "createdAt" | "lastLoginAt">

export const LastLoginCell = ({
  createdAt,
  lastLoginAt,
}: LastLoginCellProps) => {
  const lastLoginText = getLastLoginText({ createdAt, lastLoginAt })

  if (!lastLoginAt) {
    return (
      <Text textStyle="caption-2" color="interaction.support.disabled-content">
        {lastLoginText}
      </Text>
    )
  }

  if (getDaysFromLastLogin(lastLoginAt) > 90) {
    return (
      <Tooltip label="For security, remove users that haven't accessed Studio for more than 3 months.">
        <HStack gap="0.5rem">
          <Text textStyle="caption-2" color="utility.feedback.critical">
            {lastLoginText}
          </Text>
          <ChakraRiInformationLine color="utility.feedback.critical" />
        </HStack>
      </Tooltip>
    )
  }

  return <Text textStyle="caption-2">{lastLoginText}</Text>
}
