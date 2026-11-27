import { POLYGLOT_SSO_ROLES } from "~/constants/polyglot"
import { trpc } from "~/utils/trpc"

export const useCanUsePolyglot = (siteId: number) => {
  const { data: roles } = trpc.resource.getRolesFor.useQuery({
    siteId,
    resourceId: null,
  })

  return !!roles?.some(({ role }) => POLYGLOT_SSO_ROLES.includes(role))
}
