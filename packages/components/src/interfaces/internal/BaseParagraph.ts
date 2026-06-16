import type { Static } from "@sinclair/typebox"

import type { ParagraphSchema } from "../native"

export type BaseParagraphProps = Omit<
  Static<typeof ParagraphSchema>,
  "type" | "content"
> & {
  content: string
  allowedTags?: string[]
  id?: string
  className?: string
}
