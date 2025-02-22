import { useContext } from "react"
import { Text } from "@chakra-ui/react"

import { UserManagementContext } from "~/features/users"

export const CollaboratorsDescription = () => {
  const ability = useContext(UserManagementContext)

  const canCreate = ability.can("create", "UserManagement")
  const canUpdate = ability.can("update", "UserManagement")

  if (canCreate || canUpdate) {
    return (
      <Text textStyle="body-2">
        View and manage people that you collaborate with you on this site
      </Text>
    )
  }

  const canRead = ability.can("read", "UserManagement")
  if (canRead) {
    return (
      <Text textStyle="body-2">
        View people that you collaborate with you on this site
      </Text>
    )
  }

  return null
}
