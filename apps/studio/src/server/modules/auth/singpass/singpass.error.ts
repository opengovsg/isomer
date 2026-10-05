export class SingpassRequestError extends Error {
  readonly singpassError?: string

  constructor(
    message: string,
    options?: { cause?: unknown; singpassError?: string },
  ) {
    super(message, options)
    this.name = "SingpassRequestError"
    this.singpassError = options?.singpassError
  }
}
