import type {
  ColumnLayout,
  IsomerComponent,
} from "@opengovsg/isomer-components"
import { COLUMN_LAYOUT_COLUMN_COUNT } from "@opengovsg/isomer-components"

export type AccordionBlock = Extract<IsomerComponent, { type: "accordion" }>
export type ColumnBlock = Extract<IsomerComponent, { type: "column" }>

// Accordions created before container blocks store a single prose body in
// `details` and have no `content` list.
export const isLegacyAccordion = (block: AccordionBlock): boolean =>
  block.content === undefined

// Moves the legacy prose body into `content` so the accordion can be edited
// as a container. A body with nothing in it becomes an empty list rather than
// an empty text block.
export const normaliseLegacyAccordion = (
  block: AccordionBlock,
): AccordionBlock => {
  if (!isLegacyAccordion(block)) {
    return block
  }

  const { details, ...rest } = block
  const hasDetails =
    details?.content !== undefined && details.content.length > 0

  return {
    ...rest,
    content: hasDetails ? [details] : [],
  }
}

// Keeps the number of column slots in step with the chosen layout: extra
// slots are dropped and missing ones are added empty.
export const resizeColumns = (
  columns: ColumnBlock["columns"],
  variant: ColumnLayout,
): ColumnBlock["columns"] =>
  Array.from(
    { length: COLUMN_LAYOUT_COLUMN_COUNT[variant] },
    (_, index) => columns[index] ?? [],
  )
