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
