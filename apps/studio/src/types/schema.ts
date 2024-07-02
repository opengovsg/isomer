import { type JsonSchema7 } from '@jsonforms/core'
import { type IsomerComplexComponentProps } from '@opengovsg/isomer-components'

export interface IsomerJsonSchema extends JsonSchema7 {
  groups?: Array<{
    label: string
    fields: string[]
  }>
  components: {
    complex: Record<IsomerComplexComponentProps['type'], JsonSchema7>
  }
}
