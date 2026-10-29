import { z, ZodError } from "zod"

/** Shape attached to tRPC `error.data.zodError` for BAD_REQUEST validation failures. */
export function flattenZodErrorForTrpcClient(
  procedureErrorCode: string,
  cause: unknown,
) {
  if (procedureErrorCode === "BAD_REQUEST" && cause instanceof ZodError) {
    return z.flattenError(cause)
  }
  return null
}
