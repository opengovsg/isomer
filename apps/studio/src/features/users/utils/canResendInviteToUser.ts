import { isBeforeUserMgmtLaunch } from "./lastLogin"

interface CanResendInviteToUserProps {
  createdAt: Date | null
  lastLoginAt: Date | null
}

export const canResendInviteToUser = ({
  createdAt,
  lastLoginAt,
}: CanResendInviteToUserProps) => {
  if (!lastLoginAt && isBeforeUserMgmtLaunch(createdAt)) {
    return false
  }

  if (!lastLoginAt) {
    return true
  }

  return false
}
