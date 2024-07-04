import { type JsonFormsRendererRegistryEntry } from '@jsonforms/core'
import { JsonForms } from '@jsonforms/react'

import Ajv from 'ajv'
import { useState } from 'react'

import { type IsomerComplexComponentProps } from '@opengovsg/isomer-components'
import { useEditorDrawerContext } from '~/contexts/EditorDrawerContext'
import { type IsomerJsonSchema } from '~/types/schema'
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

function getComponentSubschema(
  isomerJsonSchema: IsomerJsonSchema | null,
  component: IsomerComplexComponentProps['type'],
) {
  if (!isomerJsonSchema) {
    return {}
  }

  const { properties, ...rest } = isomerJsonSchema.components.complex[component]
  return {
    ...rest,
    properties,
    components: isomerJsonSchema.components,
  }
}

export interface FormBuilderProps {
  component: IsomerComplexComponentProps['type']
}

export default function FormBuilder({
  component,
}: FormBuilderProps): JSX.Element {
  const { isomerJsonSchema } = useEditorDrawerContext()
  const subSchema = getComponentSubschema(isomerJsonSchema, component)
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
