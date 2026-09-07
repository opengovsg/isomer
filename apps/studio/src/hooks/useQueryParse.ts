/* oxlint-disable typescript/no-deprecated -- studio lint cleanup */
import type { ZodTypeAny } from "zod"
import { useRouter } from "next/router"

export const useQueryParse = <T extends ZodTypeAny>(schema: T) => {
  const { query } = useRouter()
  // SAFETY: schema.parse validates router query against the caller's Zod schema
  return schema.parse(query) as T["_output"]
}
