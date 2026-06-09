import { trpc } from "~/utils/trpc"

import type { IsomerAdminRole } from "@isomer/db"

interface UseIsUserIsomerAdminProps {
  roles: IsomerAdminRole[]
}

export const useIsUserIsomerAdmin = ({ roles }: UseIsUserIsomerAdminProps) => {
  const { data: isAdmin, isLoading } = trpc.user.isIsomerAdmin.useQuery(
    { roles },
    { retry: false },
  )

  return { isAdmin: isAdmin ?? false, isLoading }
}
