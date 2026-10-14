import type { PropsWithChildren } from "react"
import type { ResourceAbility } from "~/server/modules/permissions/permissions.type"
import { usePermissions } from "~/features/permissions"

/**
 * Single source of truth for who can manage Collection Filters / tag categories.
 *
 * Today that is site Admins (CASL: create at site root). Change only here if
 * the required permission should differ from other site-admin settings.
 */
export const canManageCollectionFilters = (ability: ResourceAbility): boolean =>
  ability.can("create", { parentId: null })

export const useCanManageCollectionFilters = (): boolean =>
  canManageCollectionFilters(usePermissions())

export const CanManageCollectionFilters = ({
  children,
}: PropsWithChildren): JSX.Element | null => {
  const canManage = useCanManageCollectionFilters()
  if (!canManage) {
    return null
  }
  return <>{children}</>
}
