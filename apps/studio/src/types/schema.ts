import {
  type GroupLayout,
  type JsonSchema,
  type UISchemaElement,
  type VerticalLayout,
} from '@jsonforms/core'

export type IsomerExtendedJsonSchema = JsonSchema & {
  groups?: Array<{
    label: string
    fields: string[]
  }>
}

export function isGroupLayout(
  uischema: UISchemaElement,
): uischema is GroupLayout {
  return uischema.type === 'Group' && 'elements' in uischema
}

export function isVerticalLayout(
  uischema: UISchemaElement,
): uischema is VerticalLayout {
  return uischema.type === 'VerticalLayout' && 'elements' in uischema
}
