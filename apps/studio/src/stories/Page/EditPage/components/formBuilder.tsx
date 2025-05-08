import { JsonForms } from "@jsonforms/react"
import { type TSchema } from "@sinclair/typebox"

import { renderers } from "~/features/editing-experience/components/form-builder/FormBuilder"
import { ajv } from "~/utils/ajv"

interface FormBuilderProps {
  schema: TSchema
  data: unknown
}

export function FormBuilder({ schema, data }: FormBuilderProps): JSX.Element {
  return (
    <JsonForms schema={schema} data={data} renderers={renderers} ajv={ajv} />
  )
}
