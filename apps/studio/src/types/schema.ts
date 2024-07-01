import { type JsonSchema7 } from '@jsonforms/core'

export interface IsomerJsonSchema extends JsonSchema7 {
  groups?: Array<{
    label: string
    fields: string[]
  }>
}
