import { type JsonFormsRendererRegistryEntry } from '@jsonforms/core'
import { JsonForms } from '@jsonforms/react'

import Ajv from 'ajv'
import { useState } from 'react'

import {
  IsomerComplexComponentsMap,
  type IsomerComplexComponentProps,
} from '@opengovsg/isomer-components'
import {
  JsonFormsAllOfControl,
  JsonFormsAnyOfControl,
  JsonFormsArrayControl,
  JsonFormsBooleanControl,
  JsonFormsDropdownControl,
  JsonFormsIntegerControl,
  JsonFormsObjectControl,
  JsonFormsProseControl,
  JsonFormsRadioControl,
  JsonFormsTextControl,
  jsonFormsAllOfControlTester,
  jsonFormsAnyOfControlTester,
  jsonFormsArrayControlTester,
  jsonFormsBooleanControlTester,
  jsonFormsDropdownControlTester,
  jsonFormsGroupLayoutRenderer,
  jsonFormsGroupLayoutTester,
  jsonFormsIntegerControlTester,
  jsonFormsObjectControlTester,
  jsonFormsProseControlTester,
  jsonFormsRadioControlTester,
  jsonFormsTextControlTester,
  jsonFormsVerticalLayoutRenderer,
  jsonFormsVerticalLayoutTester,
} from './renderers'

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
  component: IsomerComplexComponentProps['type']
}

export default function FormBuilder({
  component,
}: FormBuilderProps): JSX.Element {
  const subSchema = IsomerComplexComponentsMap[component]
  const [formData, setFormData] = useState({})

  return (
    <JsonForms
      schema={subSchema || {}}
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
