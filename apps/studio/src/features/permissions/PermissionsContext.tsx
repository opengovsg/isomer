import type { PropsWithChildren } from "react"
import { createContext, useContext } from "react"
import { AbilityBuilder, createMongoAbility, PureAbility } from "@casl/ability"
import { createContextualCan } from "@casl/react"

import type { ResourceAbility } from "~/server/modules/permissions/permissions.type"
import type { RoleType } from "~prisma/generated/generatedEnums"
import { buildPermissionsForResource } from "~/server/modules/permissions/permissions.util"
import { trpc } from "~/utils/trpc"

interface PermissionsProviderProps {
  siteId: number
  resourceId?: string
}

const getPermissions = (roles: { role: RoleType }[]) => {
  const builder = new AbilityBuilder<ResourceAbility>(createMongoAbility)
  roles.forEach(({ role }) => {
    buildPermissionsForResource(role, builder)
  })
  return builder.build({ detectSubjectType: () => "Resource" })
}

export const PermissionsContext = createContext<ResourceAbility | PureAbility>(
  // NOTE: Pass a dummy ability that does not allow the user to do anything
  // so that the createContextualCan function does not throw a type error
  new PureAbility(),
)

export const PermissionsProvider = ({
  children,
  siteId,
  resourceId,
}: PropsWithChildren<PermissionsProviderProps>) => {
  const [roles] = trpc.resource.getRolesFor.useSuspenseQuery({
    siteId,
    resourceId: resourceId ?? null,
  })

  const ability = getPermissions(roles)

  return (
    <PermissionsContext.Provider value={ability}>
      {children}
    </PermissionsContext.Provider>
  )
}

export const usePermissions = (): ResourceAbility | PureAbility => {
  const ability = useContext(PermissionsContext)
  return ability
}

export const Can = createContextualCan(PermissionsContext.Consumer)
