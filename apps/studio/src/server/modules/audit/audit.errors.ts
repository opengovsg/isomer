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

export class MonthRangeError extends Error {
  requestedMonth: string

  constructor(
    requestedMonth: string,
    message = "You can only export audit logs from the past 12 months",
  ) {
    super(message)
    this.requestedMonth = requestedMonth
    this.name = "MonthRangeError"
  }
}
