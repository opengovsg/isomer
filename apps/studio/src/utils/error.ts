import type { TRPC_ERROR_CODE_KEY } from "@trpc/server/rpc"
import { TRPC_ERROR_CODES_BY_KEY } from "@trpc/server/rpc"
import { z } from "zod"

const trpcErrorCodeKeys = Object.keys(TRPC_ERROR_CODES_BY_KEY)
// SAFETY: Object.keys on TRPC_ERROR_CODES_BY_KEY returns every defined error code key
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
const TRPC_ERROR_CODE_KEY_ENUM = trpcErrorCodeKeys as [
  TRPC_ERROR_CODE_KEY,
  ...TRPC_ERROR_CODE_KEY[],
]

export const TRPCWithErrorCodeSchema = z
  .object({
    data: z.object({ code: z.enum(TRPC_ERROR_CODE_KEY_ENUM) }),
  })
  .transform((data) => data.data.code)
