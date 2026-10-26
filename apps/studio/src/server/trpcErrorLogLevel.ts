import type { TRPCError } from "@trpc/server"
import { getHTTPStatusCodeFromError } from "@trpc/server/http"

const MIN_SERVER_ERROR_STATUS_CODE = 500

// Client errors (4xx) are expected; logging them at error buries real failures
export const getTrpcErrorLogLevel = (error: TRPCError) =>
  getHTTPStatusCodeFromError(error) >= MIN_SERVER_ERROR_STATUS_CODE
    ? "error"
    : "warn"
