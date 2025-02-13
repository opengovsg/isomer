import type { JsonFormsRendererRegistryEntry } from "@jsonforms/core"
import type { ValidateFunction } from "ajv"
import { rankWith } from "@jsonforms/core"
import { JsonForms } from "@jsonforms/react"
import { type TSchema } from "@sinclair/typebox"
import Ajv from "ajv"
import { groupBy } from "lodash"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useBuilderErrors } from "./ErrorProvider"
import {
  JsonFormsAllOfControl,
  jsonFormsAllOfControlTester,
  JsonFormsAnyOfControl,
  jsonFormsAnyOfControlTester,
  JsonFormsArrayControl,
  jsonFormsArrayControlTester,
  JsonFormsBooleanControl,
  jsonFormsBooleanControlTester,
  JsonFormsCategoryControl,
  jsonFormsCategoryControlTester,
  JsonFormsConstControl,
  jsonFormsConstControlTester,
  JsonFormsDateControl,
  jsonFormsDateControlTester,
  JsonFormsEmbedControl,
  jsonFormsEmbedControlTester,
  jsonFormsGroupLayoutRenderer,
  jsonFormsGroupLayoutTester,
  JsonFormsHiddenControl,
  jsonFormsHiddenControlTester,
  JsonFormsImageControl,
  jsonFormsImageControlTester,
  JsonFormsIntegerControl,
  jsonFormsIntegerControlTester,
  JsonFormsLinkControl,
  jsonFormsLinkControlTester,
  JsonFormsObjectControl,
  jsonFormsObjectControlTester,
  JsonFormsProseControl,
  jsonFormsProseControlTester,
  JsonFormsRefControl,
  jsonFormsRefControlTester,
  JsonFormsTextAreaControl,
  jsonFormsTextAreaControlTester,
  JsonFormsTextControl,
  jsonFormsTextControlTester,
  JsonFormsUnionRootControl,
  jsonFormsUnionRootControlTester,
  jsonFormsVerticalLayoutRenderer,
  jsonFormsVerticalLayoutTester,
} from "./renderers"

export const renderers: JsonFormsRendererRegistryEntry[] = [
  {
    tester: jsonFormsProseControlTester,
    renderer: JsonFormsProseControl,
  },
  { tester: jsonFormsDateControlTester, renderer: JsonFormsDateControl },
  { tester: jsonFormsObjectControlTester, renderer: JsonFormsObjectControl },
  { tester: jsonFormsArrayControlTester, renderer: JsonFormsArrayControl },
  { tester: jsonFormsBooleanControlTester, renderer: JsonFormsBooleanControl },
  { tester: jsonFormsConstControlTester, renderer: JsonFormsConstControl },
  {
    tester: jsonFormsUnionRootControlTester,
    renderer: JsonFormsUnionRootControl,
  },
  { tester: jsonFormsEmbedControlTester, renderer: JsonFormsEmbedControl },
  { tester: jsonFormsHiddenControlTester, renderer: JsonFormsHiddenControl },
  { tester: jsonFormsIntegerControlTester, renderer: JsonFormsIntegerControl },
  { tester: jsonFormsImageControlTester, renderer: JsonFormsImageControl },
  { tester: jsonFormsLinkControlTester, renderer: JsonFormsLinkControl },
  {
    tester: jsonFormsTextAreaControlTester,
    renderer: JsonFormsTextAreaControl,
  },
  { tester: jsonFormsTextControlTester, renderer: JsonFormsTextControl },
  { tester: jsonFormsRefControlTester, renderer: JsonFormsRefControl },
  { tester: jsonFormsAllOfControlTester, renderer: JsonFormsAllOfControl },
  { tester: jsonFormsAnyOfControlTester, renderer: JsonFormsAnyOfControl },
  {
    tester: jsonFormsGroupLayoutTester,
    renderer: jsonFormsGroupLayoutRenderer,
  },
  {
    tester: jsonFormsVerticalLayoutTester,
    renderer: jsonFormsVerticalLayoutRenderer,
  },
  {
    // NOTE: If we fall through all our previous testers,
    // we render null so that the users don't get visual noise
    tester: rankWith(JSON_FORMS_RANKING.Catchall, () => true),
    renderer: () => null,
  },
  {
    tester: jsonFormsCategoryControlTester,
    renderer: JsonFormsCategoryControl,
  },
]
const ajv = new Ajv({
  useDefaults: true,
  allErrors: true,
  strict: false,
  logger: false,
})

interface FormBuilderProps<T> {
  schema: TSchema
  validateFn: ValidateFunction<T>
  data: unknown
  handleChange: (data: T) => void
}

export default function FormBuilder<T>({
  schema,
  validateFn,
  data,
  handleChange,
}: FormBuilderProps<T>): JSX.Element {
  const { setErrors } = useBuilderErrors()

  return (
    <JsonForms
      schema={schema}
      data={data}
      renderers={renderers}
      onChange={({ data, errors }) => {
        if (validateFn(data)) {
          handleChange(data)
        }
        setErrors(groupBy(errors, "instancePath"))
      }}
      ajv={ajv}
    />
  )
}
