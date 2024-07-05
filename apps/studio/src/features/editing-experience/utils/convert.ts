import {
  schema,
  type IsomerNativeComponentProps,
} from '@opengovsg/isomer-components'
import { type JSONContent } from '@tiptap/react'
import Ajv from 'ajv'

export const validateAsProse = (
  content: JSONContent,
): IsomerNativeComponentProps => {
  const ajv = new Ajv({ strict: false })
  const subSchema = {
    ...schema.components.native.prose,
    components: schema.components,
  }
  const validate = ajv.compile<IsomerNativeComponentProps>(subSchema)

  if (validate(content)) {
    return content
  }

  throw new Error(`Expected ProseProps, got: ${JSON.stringify(content)}`)
}
