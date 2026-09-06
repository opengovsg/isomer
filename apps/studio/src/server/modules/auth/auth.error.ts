type ErrorCauseValue =
  | string
  | number
  | boolean
  | null
  | Error
  | ErrorCauseFields
type ErrorCauseFields = { [key: string]: ErrorCauseValue }

type AuthMessageInput = string | Error | ErrorCauseFields

const isStringMessage = (value: AuthMessageInput): value is string =>
  Object.prototype.toString.call(value) === "[object String]"

const isErrorCauseFields = (value: AuthMessageInput): value is ErrorCauseFields =>
  !(value instanceof Error) && Object(value) === value

const spreadErrorCause = (error: Error) => {
  const cause = error.cause
  // SAFETY: Error.cause is narrowed to ErrorCauseFields when it is a plain object
  if (isErrorCauseFields(cause as AuthMessageInput)) {
    return { err: error, ...cause } satisfies ErrorCauseFields
  }
  return { err: error } satisfies ErrorCauseFields
}

class AuthError extends Error {
  constructor(message: AuthMessageInput, cause?: ErrorCauseFields) {
    if (message instanceof Error) {
      super(undefined, {
        cause: { ...spreadErrorCause(message), ...cause },
      })
    } else if (isStringMessage(message)) {
      const resolvedCause =
        cause instanceof Error ? spreadErrorCause(cause) : cause
      super(message, resolvedCause)
    } else {
      super(undefined, message)
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
