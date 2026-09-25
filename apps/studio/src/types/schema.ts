import {
  type GroupLayout,
  type JsonSchema,
  type UISchemaElement,
  type VerticalLayout,
} from "@jsonforms/core"

export interface FieldVisibleWhen {
  property: string
  schema: JsonSchema
  /** Resolve `property` from the form root. Needed for fields nested under another object. */
  root?: boolean
}

export type IsomerExtendedJsonSchema = JsonSchema & {
  groups?: {
    label: string
    fields: string[]
    visibleWhen?: {
      property: string
      schema: JsonSchema
    }
  }[]
  properties?: Record<string, JsonSchema & { visibleWhen?: FieldVisibleWhen }>
}

export function isGroupLayout(
  uischema: UISchemaElement,
): uischema is GroupLayout {
  return uischema.type === "Group" && "elements" in uischema
}

export function isVerticalLayout(
  uischema: UISchemaElement,
): uischema is VerticalLayout {
  return uischema.type === "VerticalLayout" && "elements" in uischema
}
