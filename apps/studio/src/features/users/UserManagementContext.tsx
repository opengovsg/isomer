import type { PropsWithChildren } from "react"
import { createContext, useMemo } from "react"
import { PureAbility } from "@casl/ability"

import type { UserManagementAbility } from "~/server/modules/permissions/permissions.type"
import { buildUserManagementPermissions } from "~/server/modules/permissions/permissions.util"
import { trpc } from "~/utils/trpc"

export const UserManagementContext = createContext<
  UserManagementAbility | PureAbility
>(
  // NOTE: Pass a dummy ability that does not allow the user to do anything
  // so that the createContextualCan function does not throw a type error
  new PureAbility(),
)

interface UserManagementProviderProps {
  siteId: number
}

export const UserManagementProvider = ({
  siteId,
  children,
}: PropsWithChildren<UserManagementProviderProps>) => {
  const { data: roles } = trpc.resource.getRolesFor.useQuery({
    siteId,
    resourceId: null,
  })

  const ability = useMemo(
    () => (roles ? buildUserManagementPermissions(roles) : new PureAbility()),
    [roles],
  )

  return (
    <UserManagementContext.Provider value={ability}>
      {children}
    </UserManagementContext.Provider>
  )
}
