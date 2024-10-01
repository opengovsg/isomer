import type { PropsWithChildren } from "react"
import { createContext, useContext } from "react"
import { AbilityBuilder, createMongoAbility } from "@casl/ability"
import { RoleType } from "@prisma/client"

import type { ResourceAbility } from "~/server/modules/permissions/permissions.type"
import { buildPermissionsFor } from "~/server/modules/permissions/permissions.util"
import { trpc } from "~/utils/trpc"

interface PermissionsContextReturn {
  ability: ResourceAbility
}

interface PermissionsProviderProps {
  siteId: number
  resourceId?: string
}

const getPermissions = (roles: { role: RoleType }[]) => {
  const builder = new AbilityBuilder<ResourceAbility>(createMongoAbility)
  roles.forEach(({ role }) => {
    buildPermissionsFor(role, builder)
  })
  return builder.build({ detectSubjectType: () => "Resource" })
}

export const PermissionsContext =
  createContext<PermissionsContextReturn | null>(null)

export const PermissionsProvider = ({
  children,
  siteId,
  resourceId,
}: PropsWithChildren<PermissionsProviderProps>) => {
  const [roles] = trpc.resource.getRolesFor.useSuspenseQuery({
    siteId,
    resourceId: resourceId ?? null,
  })

  // TODO: need to get the roles from backend
  const ability = getPermissions(roles)

  return (
    <PermissionsContext.Provider value={{ ability }}>
      {children}
    </PermissionsContext.Provider>
  )
}

export const usePermissions = (): PermissionsContextReturn => {
  const context = useContext(PermissionsContext)
  if (!context) {
    throw new Error(
      `usePermissionsState must be used within a PermissionsStateProvider component`,
    )
  }
  return context
}
