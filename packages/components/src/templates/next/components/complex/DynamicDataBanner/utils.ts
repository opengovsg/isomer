export const getSingaporeDateYYYYMMDD = (): string => {
  const singaporeDateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  return singaporeDateFormatter.format(new Date()) // Outputs YYYY-MM-DD
}

export const getSingaporeDateLong = (): string => {
  const singaporeDateFormatter = new Intl.DateTimeFormat("en-SG", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  return singaporeDateFormatter.format(new Date()) // Outputs DD Month YYYY
}
