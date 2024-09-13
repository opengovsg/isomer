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
  JsonFormsAccordionTextControl,
  jsonFormsAccordionTextControlTester,
  JsonFormsAllOfControl,
  jsonFormsAllOfControlTester,
  JsonFormsAnyOfControl,
  jsonFormsAnyOfControlTester,
  JsonFormsArrayControl,
  jsonFormsArrayControlTester,
  JsonFormsBooleanControl,
  jsonFormsBooleanControlTester,
  JsonFormsCalloutTextControl,
  jsonFormsCalloutTextControlTester,
  JsonFormsConstControl,
  jsonFormsConstControlTester,
  jsonFormsGroupLayoutRenderer,
  jsonFormsGroupLayoutTester,
  JsonFormsImageControl,
  jsonFormsImageControlTester,
  JsonFormsIntegerControl,
  jsonFormsIntegerControlTester,
  JsonFormsLinkControl,
  jsonFormsLinkControlTester,
  JsonFormsObjectControl,
  jsonFormsObjectControlTester,
  JsonFormsTextControl,
  jsonFormsTextControlTester,
  jsonFormsVerticalLayoutRenderer,
  jsonFormsVerticalLayoutTester,
} from "./renderers"

const renderers: JsonFormsRendererRegistryEntry[] = [
  { tester: jsonFormsObjectControlTester, renderer: JsonFormsObjectControl },
  { tester: jsonFormsArrayControlTester, renderer: JsonFormsArrayControl },
  { tester: jsonFormsBooleanControlTester, renderer: JsonFormsBooleanControl },
  { tester: jsonFormsConstControlTester, renderer: JsonFormsConstControl },
  { tester: jsonFormsIntegerControlTester, renderer: JsonFormsIntegerControl },
  { tester: jsonFormsImageControlTester, renderer: JsonFormsImageControl },
  { tester: jsonFormsLinkControlTester, renderer: JsonFormsLinkControl },
  { tester: jsonFormsTextControlTester, renderer: JsonFormsTextControl },
  { tester: jsonFormsAllOfControlTester, renderer: JsonFormsAllOfControl },
  { tester: jsonFormsAnyOfControlTester, renderer: JsonFormsAnyOfControl },
  {
    tester: jsonFormsAccordionTextControlTester,
    renderer: JsonFormsAccordionTextControl,
  },
  {
    tester: jsonFormsCalloutTextControlTester,
    renderer: JsonFormsCalloutTextControl,
  },
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
]
const ajv = new Ajv({ allErrors: true, strict: false, logger: false })

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
