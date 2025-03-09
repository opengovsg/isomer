import { differenceInDays, isBefore } from "date-fns"

// We did not track "last login" until 9th March 2025 (User management launched)
// This means users who have login before but yet to login again after that date
// will not have a "last login" record
// So we need to check if the user was created before that date
// and display a different message in order not to be misleading
export const isBeforeUserMgmtLaunch = (createdAt: Date | null) =>
  isBefore(createdAt ?? new Date(), new Date("2025-03-09"))

export const getDaysFromLastLogin = (lastLoginAt: Date) =>
  differenceInDays(new Date(), lastLoginAt)

interface GetLastLoginTextProps {
  createdAt: Date | null
  lastLoginAt: Date | null
}

export const getLastLoginText = ({
  createdAt,
  lastLoginAt,
}: GetLastLoginTextProps) => {
  if (!lastLoginAt && isBeforeUserMgmtLaunch(createdAt)) {
    return "-"
  }

  if (!lastLoginAt) {
    return "Waiting to accept invite"
  }

  const daysFromLastLogin = getDaysFromLastLogin(lastLoginAt)

  if (daysFromLastLogin > 90) {
    return "More than 90 days ago"
  }

  if (daysFromLastLogin === 0) {
    return "Today"
  }

  return `${daysFromLastLogin} ${daysFromLastLogin === 1 ? "day" : "days"} ago`
}
