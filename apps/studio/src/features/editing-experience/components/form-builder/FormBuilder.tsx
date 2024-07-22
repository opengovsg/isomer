import type { IsomerComponent } from "@opengovsg/isomer-components"
import { type JsonFormsRendererRegistryEntry } from "@jsonforms/core"
import { JsonForms } from "@jsonforms/react"
import { getComponentSchema } from "@opengovsg/isomer-components"
import Ajv from "ajv"

import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
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

export default function FormBuilder(): JSX.Element {
  const {
    savedPageState,
    previewPageState,
    setPreviewPageState,
    currActiveIdx,
  } = useEditorDrawerContext()

  if (currActiveIdx === -1 || currActiveIdx > savedPageState.length) {
    return <></>
  }

  const component = previewPageState[currActiveIdx]

  if (!component) {
    return <></>
  }

  const subSchema = getComponentSchema(component.type)
  const data = previewPageState[currActiveIdx]
  const ajv = new Ajv({ strict: false })
  const validateFn = ajv.compile<IsomerComponent>(subSchema)

  return (
    <JsonForms
      schema={subSchema}
      data={data}
      renderers={renderers}
      onChange={({ data }) => {
        if (validateFn(data)) {
          const newPageState = [...savedPageState]
          newPageState[currActiveIdx] = data
          setPreviewPageState(newPageState)
        }
      }}
      ajv={ajv}
    />
  )
}
