import type { JsonFormsRendererRegistryEntry } from "@jsonforms/core"
import type { ValidateFunction } from "ajv"
import { rankWith } from "@jsonforms/core"
import { JsonForms } from "@jsonforms/react"
import { type TSchema } from "@sinclair/typebox"
import { groupBy } from "lodash"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { ajv } from "~/utils/ajv"
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
  JsonFormsChildrenPagesLayoutControl,
  jsonFormsChildrenPagesLayoutControlTester,
  JsonFormsChildrenPagesOrderingControl,
  jsonFormsChildrenPagesOrderingControlTester,
  JsonFormsCollectionDropdownControl,
  jsonFormsCollectionDropdownControlTester,
  JsonFormsConstControl,
  jsonFormsConstControlTester,
  JsonFormsDateControl,
  jsonFormsDateControlTester,
  JsonFormsDisabledControl,
  jsonFormsDisabledControlTester,
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
  JsonFormsMetaImageControl,
  jsonFormsMetaImageControlTester,
  JsonFormsObjectControl,
  jsonFormsObjectControlTester,
  JsonFormsProseControl,
  jsonFormsProseControlTester,
  JsonFormsRefControl,
  jsonFormsRefControlTester,
  JsonFormsTagCategoriesControl,
  jsonFormsTagCategoriesControlTester,
  JsonFormsTaggedControl,
  jsonFormsTaggedControlTester,
  JsonFormsTextAreaControl,
  jsonFormsTextAreaControlTester,
  JsonFormsTextControl,
  jsonFormsTextControlTester,
  JsonFormsUnionRootControl,
  jsonFormsUnionRootControlTester,
  JsonFormsUuidControl,
  jsonFormsUuidControlTester,
  jsonFormsVerticalLayoutRenderer,
  jsonFormsVerticalLayoutTester,
} from "./renderers"

export const renderers: JsonFormsRendererRegistryEntry[] = [
  {
    renderer: JsonFormsDisabledControl,
    tester: jsonFormsDisabledControlTester,
  },
  {
    tester: jsonFormsTagCategoriesControlTester,
    renderer: JsonFormsTagCategoriesControl,
  },
  { renderer: JsonFormsUuidControl, tester: jsonFormsUuidControlTester },
  { renderer: JsonFormsTaggedControl, tester: jsonFormsTaggedControlTester },
  {
    renderer: JsonFormsChildrenPagesOrderingControl,
    tester: jsonFormsChildrenPagesOrderingControlTester,
  },
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
    tester: jsonFormsMetaImageControlTester,
    renderer: JsonFormsMetaImageControl,
  },
  {
    tester: jsonFormsChildrenPagesLayoutControlTester,
    renderer: JsonFormsChildrenPagesLayoutControl,
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
  {
    tester: jsonFormsCollectionDropdownControlTester,
    renderer: JsonFormsCollectionDropdownControl,
  },
]

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
