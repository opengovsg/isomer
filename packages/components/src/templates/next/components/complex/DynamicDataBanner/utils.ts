const SINGAPORE_DATE_FORMATTER_YYYYMMDD = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Singapore",
  year: "numeric",
})

const SINGAPORE_DATE_FORMATTER_LONG = new Intl.DateTimeFormat("en-SG", {
  day: "numeric",
  month: "long",
  timeZone: "Asia/Singapore",
  year: "numeric",
})

export const getSingaporeDateYYYYMMDD = (): string =>
  // Outputs YYYY-MM-DD
  SINGAPORE_DATE_FORMATTER_YYYYMMDD.format(new Date())

export const getSingaporeDateLong = (): string =>
  // Outputs DD Month YYYY
  SINGAPORE_DATE_FORMATTER_LONG.format(new Date())
