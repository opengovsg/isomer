import type { IsomerComponentTypes } from "@opengovsg/isomer-components"
import { useState } from "react"
import { type JsonFormsRendererRegistryEntry } from "@jsonforms/core"
import { JsonForms } from "@jsonforms/react"
import { getComponentSchema } from "@opengovsg/isomer-components"
import Ajv from "ajv"

import {
  JsonFormsAllOfControl,
  jsonFormsAllOfControlTester,
  JsonFormsAnyOfControl,
  jsonFormsAnyOfControlTester,
  JsonFormsArrayControl,
  jsonFormsArrayControlTester,
  JsonFormsBooleanControl,
  jsonFormsBooleanControlTester,
  JsonFormsDropdownControl,
  jsonFormsDropdownControlTester,
  jsonFormsGroupLayoutRenderer,
  jsonFormsGroupLayoutTester,
  JsonFormsIntegerControl,
  jsonFormsIntegerControlTester,
  JsonFormsObjectControl,
  jsonFormsObjectControlTester,
  JsonFormsProseControl,
  jsonFormsProseControlTester,
  JsonFormsRadioControl,
  jsonFormsRadioControlTester,
  JsonFormsTextControl,
  jsonFormsTextControlTester,
  jsonFormsVerticalLayoutRenderer,
  jsonFormsVerticalLayoutTester,
} from "./renderers"

const renderers: JsonFormsRendererRegistryEntry[] = [
  { tester: jsonFormsObjectControlTester, renderer: JsonFormsObjectControl },
  { tester: jsonFormsArrayControlTester, renderer: JsonFormsArrayControl },
  { tester: jsonFormsBooleanControlTester, renderer: JsonFormsBooleanControl },
  {
    tester: jsonFormsDropdownControlTester,
    renderer: JsonFormsDropdownControl,
  },
  { tester: jsonFormsIntegerControlTester, renderer: JsonFormsIntegerControl },
  { tester: jsonFormsTextControlTester, renderer: JsonFormsTextControl },
  { tester: jsonFormsAllOfControlTester, renderer: JsonFormsAllOfControl },
  { tester: jsonFormsAnyOfControlTester, renderer: JsonFormsAnyOfControl },
  { tester: jsonFormsProseControlTester, renderer: JsonFormsProseControl },
  { tester: jsonFormsRadioControlTester, renderer: JsonFormsRadioControl },
  {
    tester: jsonFormsGroupLayoutTester,
    renderer: jsonFormsGroupLayoutRenderer,
  },
  {
    tester: jsonFormsVerticalLayoutTester,
    renderer: jsonFormsVerticalLayoutRenderer,
  },
]

export interface FormBuilderProps {
  component: IsomerComponentTypes
}

export default function FormBuilder({
  component,
}: FormBuilderProps): JSX.Element {
  const subSchema = getComponentSchema(component)
  const [formData, setFormData] = useState({})

  return (
    <JsonForms
      schema={subSchema}
      data={formData}
      renderers={renderers}
      onChange={({ data }) => {
        console.log(data)
        setFormData(data)
      }}
      ajv={new Ajv({ strict: false })}
    />
  )
}
