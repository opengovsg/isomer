import type { ZodTypeAny } from "zod"
import { useRouter } from "next/router"

export const useQueryParse = <T extends ZodTypeAny>(schema: T) => {
  const { query } = useRouter()
  // oxlint-disable-next-line @typescript-eslint/no-unsafe-return
  return schema.parse(query) as T["_output"]
}
