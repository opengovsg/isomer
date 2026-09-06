const SINGAPORE_DATE_FORMATTER_YYYYMMDD = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Singapore",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

const SINGAPORE_DATE_FORMATTER_LONG = new Intl.DateTimeFormat("en-SG", {
  timeZone: "Asia/Singapore",
  year: "numeric",
  month: "long",
  day: "numeric",
})

export const getSingaporeDateYYYYMMDD = (): string => {
  return SINGAPORE_DATE_FORMATTER_YYYYMMDD.format(new Date()) // Outputs YYYY-MM-DD
}

export const getSingaporeDateLong = (): string => {
  return SINGAPORE_DATE_FORMATTER_LONG.format(new Date()) // Outputs DD Month YYYY
}
