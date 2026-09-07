export class FutureMonthError extends Error {
  requestedMonth: string

  constructor(
    requestedMonth: string,
    message = "You cannot export audit logs for a month that is in the future",
  ) {
    super(message)
    this.requestedMonth = requestedMonth
    this.name = "FutureMonthError"
  }
}

export { MonthRangeError } from "./audit.monthRangeError"
