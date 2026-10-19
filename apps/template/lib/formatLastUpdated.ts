export const formatLastUpdated = (date: Date): string =>
  date.getDate().toString().padStart(2, "0") +
  " " +
  date.toLocaleString("default", { month: "short" }) +
  " " +
  date.getFullYear()
