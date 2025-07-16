import { Text } from "@chakra-ui/react"

import type { UserTableData } from "./types"
import { getLastLoginText } from "~/features/users/utils"

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

  return <Text textStyle="caption-2">{lastLoginText}</Text>
}
