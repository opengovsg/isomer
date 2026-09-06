import type { ListItemProps, ProseContent, TableProps } from "~/interfaces"
import { getDigestFromText } from "~/utils/getDigestFromText"

type ProseContentBlock = NonNullable<ProseContent>[number]
type TableRow = TableProps["content"][number]
type TableCell = TableRow["content"][number]

/** Prose/table/list nodes we key in native content rendering. */
export type ProseContentKeyInput =
  | ProseContentBlock
  | Pick<ListItemProps, "type" | "content">
  | ListItemProps["content"][number]
  | TableRow
  | TableCell
  | TableCell["content"][number]

export const getProseContentKey = (block: ProseContentKeyInput) =>
  getDigestFromText(JSON.stringify(block))
