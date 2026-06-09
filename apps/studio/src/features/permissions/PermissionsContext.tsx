import type { PropsWithChildren } from "react"
import type { ResourceAbility } from "~/server/modules/permissions/permissions.type"
import type { RoleType } from "@isomer/db"
import { AbilityBuilder, createMongoAbility } from "@casl/ability"
import { AbilityProvider, Can, useAbility } from "@casl/react"
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

  return <AbilityProvider value={ability}>{children}</AbilityProvider>
}

export const usePermissions = (): ResourceAbility => {
  return useAbility<ResourceAbility>()
}

export { Can }
