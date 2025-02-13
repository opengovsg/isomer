import { JsonForms } from "@jsonforms/react"
import { type TSchema } from "@sinclair/typebox"
import Ajv from "ajv"

import { renderers } from "~/features/editing-experience/components/form-builder/FormBuilder"

const ajv = new Ajv({
  useDefaults: true,
  allErrors: true,
  strict: false,
  logger: false,
})

interface FormBuilderProps {
  schema: TSchema
  data: unknown
}

export function FormBuilder({ schema, data }: FormBuilderProps): JSX.Element {
  return (
    <JsonForms schema={schema} data={data} renderers={renderers} ajv={ajv} />
  )
}
