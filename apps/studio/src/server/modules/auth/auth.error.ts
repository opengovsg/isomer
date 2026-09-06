interface ErrorCauseFields {
  err?: Error
}

const isStringMessage = (
  value: string | Error | ErrorCauseFields,
): value is string =>
  Object.prototype.toString.call(value) === "[object String]"

type ErrorCauseInput =
  | ErrorCauseFields
  | Error
  | string
  | number
  | boolean
  | null
  | undefined

const isErrorCauseFromInput = (
  value: ErrorCauseInput,
): value is ErrorCauseFields =>
  value !== null &&
  value !== undefined &&
  !(value instanceof Error) &&
  Object(value) === value &&
  !Array.isArray(value)

const spreadErrorCause = (error: Error): ErrorCauseFields => {
  // SAFETY: Error.cause is only consumed after narrowing to plain ErrorCauseFields
  const causeInput = error.cause as ErrorCauseInput
  if (isErrorCauseFromInput(causeInput)) {
    return { err: error, ...causeInput }
  }
  return { err: error }
}

class AuthError extends Error {
  constructor(
    message: string | Error | ErrorCauseFields,
    cause?: ErrorCauseFields | Error,
  ) {
    if (message instanceof Error) {
      super(undefined, {
        cause: { ...spreadErrorCause(message), ...cause },
      })
    } else if (isStringMessage(message)) {
      const resolvedCause =
        cause instanceof Error ? spreadErrorCause(cause) : cause
      super(message, { cause: resolvedCause })
    } else {
      super(undefined, { cause: message })
    }
    Error.captureStackTrace(this, this.constructor)
    this.name =
      message instanceof AuthError ? message.name : this.constructor.name
  }
}

/**
 * The user's email/token combination was invalid.
 * This could be because the email/token combination was not found in the database,
 * or because it token has expired. Ask the user to log in again.
 */
export class VerificationError extends AuthError {}
