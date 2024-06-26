import { type JsonFormsRendererRegistryEntry } from '@jsonforms/core'
import { JsonForms } from '@jsonforms/react'

import { useState } from 'react'
import IsomerSchema from '../../data/0.1.0.json'

import {
  JsonFormsBooleanControl,
  jsonFormsBooleanControlTester,
  JsonFormsDropdownControl,
  jsonFormsDropdownControlTester,
  JsonFormsIntegerControl,
  jsonFormsIntegerControlTester,
  JsonFormsRadioControl,
  jsonFormsRadioControlTester,
  JsonFormsTextControl,
  jsonFormsTextControlTester,
  jsonFormsVerticalLayoutRenderer,
  jsonFormsVerticalLayoutTester,
} from './renderers'

const renderers: JsonFormsRendererRegistryEntry[] = [
  { tester: jsonFormsBooleanControlTester, renderer: JsonFormsBooleanControl },
  {
    tester: jsonFormsDropdownControlTester,
    renderer: JsonFormsDropdownControl,
  },
  { tester: jsonFormsIntegerControlTester, renderer: JsonFormsIntegerControl },
  { tester: jsonFormsTextControlTester, renderer: JsonFormsTextControl },
  { tester: jsonFormsRadioControlTester, renderer: JsonFormsRadioControl },
  {
    tester: jsonFormsVerticalLayoutTester,
    renderer: jsonFormsVerticalLayoutRenderer,
  },
]

export interface FormBuilderProps {
  component: keyof typeof IsomerSchema.components.complex
}

export default function FormBuilder({
  component,
}: FormBuilderProps): JSX.Element {
  const { properties, ...rest } = IsomerSchema.components.complex[component]
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { type, ...props } = properties
  const newSchema = {
    ...rest,
    properties: props,
    components: IsomerSchema.components,
  }

  const [formData, setFormData] = useState({})

  return (
    <JsonForms
      schema={newSchema}
      data={formData}
      renderers={renderers}
      onChange={({ data }) => {
        console.log(data)
        setFormData(data)
      }}
    />
  )
}
