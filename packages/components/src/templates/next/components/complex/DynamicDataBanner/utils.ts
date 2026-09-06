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
  SINGAPORE_DATE_FORMATTER_YYYYMMDD.format(new Date()) // Outputs YYYY-MM-DD


export const getSingaporeDateLong = (): string => 
  SINGAPORE_DATE_FORMATTER_LONG.format(new Date()) // Outputs DD Month YYYY

