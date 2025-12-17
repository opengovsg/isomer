import { useContext } from "react"
import { Text } from "@chakra-ui/react"

import { UserManagementContext } from "~/features/users"

export const CollaboratorsDescription = () => {
  const ability = useContext(UserManagementContext)

  if (ability.can("manage", "UserManagement")) {
    return (
      <Text textStyle="body-2">
        View and manage users that work with you on this site.
      </Text>
    )
  }

  if (ability.can("read", "UserManagement")) {
    return (
      <Text textStyle="body-2">
        View users that work with you on this site.
      </Text>
    )
  }

  return null
}
