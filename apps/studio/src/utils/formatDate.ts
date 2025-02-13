const getDiffInDays = (date: Date): number => {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  return Math.floor(diffInMs / (1000 * 60 * 60 * 24))
}

const displayDateInDDMMMYYYY = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }
  return date
    .toLocaleDateString("en-GB", options)
    .replace(/(\d{2}) (\w{3}) (\d{4})/, "$1 $2 $3")
}

export const formatDate = (date: Date): string => {
  const diffInDays: number = getDiffInDays(date)

  if (diffInDays === 0) {
    return "today"
  }
  if (diffInDays === 1) {
    return "yesterday"
  }
  if (diffInDays >= 2 && diffInDays <= 6) {
    return `${diffInDays} days ago`
  }
  if (diffInDays >= 7 && diffInDays <= 14) {
    return "last week"
  }
  // Format date as "DD MMM YYYY" for anything beyond 14 days
  return displayDateInDDMMMYYYY(date)
}
