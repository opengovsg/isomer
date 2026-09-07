import type {
  GroupLayout,
  JsonSchema,
  UISchemaElement,
  VerticalLayout,
} from "@jsonforms/core"

export type IsomerExtendedJsonSchema = JsonSchema & {
  groups?: {
    label: string
    fields: string[]
  }[]
}

export const isGroupLayout = (
  uischema: UISchemaElement,
): uischema is GroupLayout =>
  uischema.type === "Group" && "elements" in uischema

export const isVerticalLayout = (
  uischema: UISchemaElement,
): uischema is VerticalLayout =>
  uischema.type === "VerticalLayout" && "elements" in uischema
