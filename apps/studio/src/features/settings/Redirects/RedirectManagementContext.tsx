import type { PropsWithChildren } from "react"
import type { RedirectManagementAbility } from "~/server/modules/permissions/permissions.type"
import { Ability } from "@casl/ability"
import { createContext, useContext, useMemo } from "react"
import { buildRedirectManagementPermissions } from "~/server/modules/permissions/permissions.util"
import { trpc } from "~/utils/trpc"

interface RedirectManagement {
  ability: RedirectManagementAbility | Ability
  // Whether the roles behind `ability` are still loading, or failed to load.
  // Both leave `ability` permitting nothing, which is indistinguishable from a
  // genuine read-only role unless the consumer can tell them apart — so it is
  // surfaced rather than collapsed into the ability.
  isPending: boolean
  isError: boolean
}

export const RedirectManagementContext = createContext<RedirectManagement>({
  // A dummy ability that permits nothing, so a consumer mounted outside the
  // provider falls back to read-only rather than to full access.
  ability: new Ability(),
  isPending: false,
  isError: false,
})

interface RedirectManagementProviderProps {
  siteId: number
}

// Reads the same site-wide roles query the other permission providers use, so
// it costs no extra request — React Query serves it from the shared cache.
export const RedirectManagementProvider = ({
  siteId,
  children,
}: PropsWithChildren<RedirectManagementProviderProps>) => {
  const {
    data: roles,
    isPending,
    isError,
  } = trpc.resource.getRolesFor.useQuery({
    siteId,
    resourceId: null,
  })

  const value = useMemo(
    () => ({
      ability: roles
        ? buildRedirectManagementPermissions(roles)
        : new Ability(),
      isPending,
      isError,
    }),
    [roles, isPending, isError],
  )

  return (
    <RedirectManagementContext.Provider value={value}>
      {children}
    </RedirectManagementContext.Provider>
  )
}

interface UseRedirectManagementResult {
  // Whether the current user may add or remove redirects. The server enforces
  // the same rule on `redirect.create` / `redirect.bulkCreate` /
  // `redirect.delete`; this only decides whether we offer the controls at all.
  // False while the roles are unknown, so callers must check `isPending` and
  // `isError` before presenting the page as read-only.
  canManageRedirects: boolean
  isPending: boolean
  isError: boolean
}

export const useRedirectManagement = (): UseRedirectManagementResult => {
  const { ability, isPending, isError } = useContext(RedirectManagementContext)
  return {
    canManageRedirects: ability.can("manage", "RedirectManagement"),
    isPending,
    isError,
  }
}
