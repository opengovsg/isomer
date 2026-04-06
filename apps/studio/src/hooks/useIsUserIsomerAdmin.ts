import type { IsomerAdminRole } from "~prisma/generated/generatedEnums"
import { trpc } from "~/utils/trpc"

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
