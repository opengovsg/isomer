import { type JsonFormsRendererRegistryEntry } from '@jsonforms/core'
import { JsonForms } from '@jsonforms/react'

import Ajv from 'ajv'
import { useState } from 'react'

import { type IsomerComplexComponentProps } from '@opengovsg/isomer-components'
import { type IsomerJsonSchema } from '~/types/schema'
import { trpc } from '~/utils/trpc'
import {
  JsonFormsArrayControl,
  JsonFormsBooleanControl,
  JsonFormsDropdownControl,
  JsonFormsIntegerControl,
  JsonFormsObjectControl,
  JsonFormsOneOfControl,
  JsonFormsProseControl,
  JsonFormsRadioControl,
  JsonFormsTextControl,
  jsonFormsArrayControlTester,
  jsonFormsBooleanControlTester,
  jsonFormsDropdownControlTester,
  jsonFormsGroupLayoutRenderer,
  jsonFormsGroupLayoutTester,
  jsonFormsIntegerControlTester,
  jsonFormsObjectControlTester,
  jsonFormsOneOfControlTester,
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
  { tester: jsonFormsOneOfControlTester, renderer: JsonFormsOneOfControl },
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
  const [jsonSchema, setJsonSchema] = useState<IsomerJsonSchema | null>(null)
  const [formData, setFormData] = useState({})

  trpc.page.getIsomerJsonSchema.useQuery(undefined, {
    onSuccess({ schema }) {
      const { properties, ...rest } = schema.components.complex[component]
      const { type: _, ...props } = properties
      const subSchema = {
        ...rest,
        properties: props,
        components: schema.components,
      }

      setJsonSchema(subSchema)
    },
  })

  return (
    <JsonForms
      schema={jsonSchema || {}}
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
