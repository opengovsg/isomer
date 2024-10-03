import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"

dayjs.extend(customParseFormat)

// Standardise the format of dates displayed on the site
export const getFormattedDate = (date: string) =>
  dayjs(date, [
    "DD/MM/YYYY",
    "D MMM YYYY",
    "DD MMM YYYY",
    "YYYY-MM-DDTHH:mm:ss.SSSZ",
  ]).format("D MMMM YYYY")
