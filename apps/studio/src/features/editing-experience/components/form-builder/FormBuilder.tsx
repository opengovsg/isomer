import type { JsonFormsRendererRegistryEntry } from "@jsonforms/core"
import type { ValidateFunction } from "ajv"
import { rankWith } from "@jsonforms/core"
import { JsonForms } from "@jsonforms/react"
import { type TSchema } from "@sinclair/typebox"
import { groupBy } from "lodash-es"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { ajv } from "~/utils/ajv"

import { useBuilderErrors } from "./ErrorProvider"
// oxlint-disable-next-line react-doctor/no-barrel-import -- internal JsonForms renderer registry; direct imports break HOC inference
import {
  default as JsonFormsAllOfControl,
  jsonFormsAllOfControlTester,
} from "./renderers/controls/JsonFormsAllOfControl"
import {
  default as JsonFormsArrayControl,
  jsonFormsArrayControlTester,
} from "./renderers/controls/JsonFormsArrayControl"
import {
  default as JsonFormsBooleanControl,
  jsonFormsBooleanControlTester,
} from "./renderers/controls/JsonFormsBooleanControl"
import {
  default as JsonFormsBoxedGroupControl,
  jsonFormsBoxedGroupControlTester,
} from "./renderers/controls/JsonFormsBoxedGroupControl"
import {
  default as JsonFormsChildrenPagesLayoutControl,
  jsonFormsChildrenPagesLayoutControlTester,
} from "./renderers/controls/JsonFormsChildPageLayoutControl"
import {
  default as JsonFormsChildrenPagesOrderingControl,
  jsonFormsChildrenPagesOrderingControlTester,
} from "./renderers/controls/JsonFormsChildrenPagesOrderingControl"
import {
  default as JsonFormsCollectionDropdownControl,
  jsonFormsCollectionDropdownControlTester,
} from "./renderers/controls/JsonFormsCollectionDropdownControl"
import {
  default as JsonFormsCollectionVariantControl,
  jsonFormsCollectionVariantControlTester,
} from "./renderers/controls/JsonFormsCollectionVariantControl"
import {
  default as JsonFormsColourPickerControl,
  jsonFormsColourPickerControlTester,
} from "./renderers/controls/JsonFormsColourPickerControl"
import {
  JsonFormsAnyOfControl,
  jsonFormsAnyOfControlTester,
  JsonFormsOneOfControl,
  jsonFormsOneOfControlTester,
} from "./renderers/controls/JsonFormsCombinatorControl"
import {
  default as JsonFormsConstControl,
  jsonFormsConstControlTester,
} from "./renderers/controls/JsonFormsConstControl"
import {
  default as JsonFormsDateControl,
  jsonFormsDateControlTester,
} from "./renderers/controls/JsonFormsDateControl"
import {
  default as JsonFormsDgsDatasetIdControl,
  jsonFormsDgsDatasetIdControlTester,
} from "./renderers/controls/JsonFormsDgsDatasetIdControl"
import {
  default as JsonFormsEmbedControl,
  jsonFormsEmbedControlTester,
} from "./renderers/controls/JsonFormsEmbedControl"
import {
  default as JsonFormsEnumControl,
  jsonFormsEnumControlTester,
} from "./renderers/controls/JsonFormsEnumControl"
import {
  default as JsonFormsHiddenControl,
  jsonFormsHiddenControlTester,
} from "./renderers/controls/JsonFormsHiddenControl"
import {
  default as JsonFormsImageControl,
  jsonFormsImageControlTester,
} from "./renderers/controls/JsonFormsImageControl"
import {
  default as JsonFormsImageRadioControl,
  jsonFormsImageRadioControlTester,
} from "./renderers/controls/JsonFormsImageRadioControl"
import {
  default as JsonFormsIntegerControl,
  jsonFormsIntegerControlTester,
} from "./renderers/controls/JsonFormsIntegerControl"
import {
  default as JsonFormsLinkArrayControl,
  jsonFormsLinkArrayControlTester,
} from "./renderers/controls/JsonFormsLinkArrayControl"
import {
  default as JsonFormsLinkControl,
  jsonFormsLinkControlTester,
} from "./renderers/controls/JsonFormsLinkControl"
import {
  default as JsonFormsMaxColumnsControl,
  jsonFormsMaxColumnsControlTester,
} from "./renderers/controls/JsonFormsMaxColumnsControl"
import {
  default as JsonFormsMetaImageControl,
  jsonFormsMetaImageControlTester,
} from "./renderers/controls/JsonFormsMetaImageControl"
import {
  default as JsonFormsNavbarControl,
  jsonFormsNavbarControlTester,
} from "./renderers/controls/JsonFormsNavbarControl"
import {
  default as JsonFormsObjectControl,
  jsonFormsObjectControlTester,
} from "./renderers/controls/JsonFormsObjectControl"
import {
  default as JsonFormsPrefillLinkControl,
  jsonFormsPrefillLinkControlTester,
} from "./renderers/controls/JsonFormsPrefillLinkControl"
import {
  default as JsonFormsProseControl,
  jsonFormsProseControlTester,
} from "./renderers/controls/JsonFormsProseControl"
import {
  default as JsonFormsRefControl,
  jsonFormsRefControlTester,
} from "./renderers/controls/JsonFormsRefControl"
import {
  default as JsonFormsSearchSGControl,
  jsonFormsSearchSGControlTester,
} from "./renderers/controls/JsonFormsSearchSGControl"
import {
  default as JsonFormsSocialMediaControl,
  jsonFormsSocialMediaControlTester,
} from "./renderers/controls/JsonFormsSocialMediaControl/JsonFormsSocialMediaControl"
import {
  default as JsonFormsTagCategoriesControl,
  jsonFormsTagCategoriesControlTester,
} from "./renderers/controls/JsonFormsTagCategoryControl"
import {
  default as JsonFormsTagCategoryOptionsControl,
  jsonFormsTagCategoryOptionsControlTester,
} from "./renderers/controls/JsonFormsTagCategoryOptionsControl"
import {
  default as JsonFormsTaggedControl,
  jsonFormsTaggedControlTester,
} from "./renderers/controls/JsonFormsTaggedControl"
import {
  default as JsonFormsTextAreaControl,
  jsonFormsTextAreaControlTester,
} from "./renderers/controls/JsonFormsTextAreaControl"
import {
  default as JsonFormsTextControl,
  jsonFormsTextControlTester,
} from "./renderers/controls/JsonFormsTextControl"
import {
  default as JsonFormsUnionRootControl,
  jsonFormsUnionRootControlTester,
} from "./renderers/controls/JsonFormsUnionRootControl"
import {
  default as JsonFormsUuidControl,
  jsonFormsUuidControlTester,
} from "./renderers/controls/JsonFormsUuidControl"
import {
  default as JsonFormsWidgetIntegrationControl,
  jsonFormsWidgetIntegrationControlTester,
} from "./renderers/controls/JsonFormsWidgetIntegrationControl"
import jsonFormsAntiScamDisclaimerBannerLayoutRenderer, {
  jsonFormsAntiScamDisclaimerBannerLayoutTester,
} from "./renderers/layouts/JsonFormsAntiScamDisclaimerBannerLayout"
import jsonFormsGroupLayoutRenderer, {
  jsonFormsGroupLayoutTester,
} from "./renderers/layouts/JsonFormsGroupLayout"
import jsonFormsVerticalLayoutRenderer, {
  jsonFormsVerticalLayoutTester,
} from "./renderers/layouts/JsonFormsVerticalLayout"

export const renderers: JsonFormsRendererRegistryEntry[] = [
  {
    renderer: JsonFormsColourPickerControl,
    tester: jsonFormsColourPickerControlTester,
  },
  {
    renderer: JsonFormsWidgetIntegrationControl,
    tester: jsonFormsWidgetIntegrationControlTester,
  },
  {
    renderer: JsonFormsSearchSGControl,
    tester: jsonFormsSearchSGControlTester,
  },
  {
    tester: jsonFormsTagCategoriesControlTester,
    renderer: JsonFormsTagCategoriesControl,
  },
  {
    tester: jsonFormsTagCategoryOptionsControlTester,
    renderer: JsonFormsTagCategoryOptionsControl,
  },
  { renderer: JsonFormsUuidControl, tester: jsonFormsUuidControlTester },
  { renderer: JsonFormsTaggedControl, tester: jsonFormsTaggedControlTester },
  {
    renderer: JsonFormsChildrenPagesOrderingControl,
    tester: jsonFormsChildrenPagesOrderingControlTester,
  },
  {
    renderer: JsonFormsNavbarControl,
    tester: jsonFormsNavbarControlTester,
  },
  {
    renderer: JsonFormsLinkArrayControl,
    tester: jsonFormsLinkArrayControlTester,
  },
  {
    renderer: JsonFormsSocialMediaControl,
    tester: jsonFormsSocialMediaControlTester,
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
  {
    tester: jsonFormsDgsDatasetIdControlTester,
    renderer: JsonFormsDgsDatasetIdControl,
  },
  { tester: jsonFormsHiddenControlTester, renderer: JsonFormsHiddenControl },
  { tester: jsonFormsIntegerControlTester, renderer: JsonFormsIntegerControl },
  {
    tester: jsonFormsImageRadioControlTester,
    renderer: JsonFormsImageRadioControl,
  },
  { tester: jsonFormsImageControlTester, renderer: JsonFormsImageControl },
  { tester: jsonFormsLinkControlTester, renderer: JsonFormsLinkControl },
  { tester: jsonFormsEnumControlTester, renderer: JsonFormsEnumControl },
  {
    tester: jsonFormsTextAreaControlTester,
    renderer: JsonFormsTextAreaControl,
  },
  { tester: jsonFormsTextControlTester, renderer: JsonFormsTextControl },
  { tester: jsonFormsRefControlTester, renderer: JsonFormsRefControl },
  { tester: jsonFormsAllOfControlTester, renderer: JsonFormsAllOfControl },
  { tester: jsonFormsAnyOfControlTester, renderer: JsonFormsAnyOfControl },
  { tester: jsonFormsOneOfControlTester, renderer: JsonFormsOneOfControl },
  {
    tester: jsonFormsGroupLayoutTester,
    renderer: jsonFormsGroupLayoutRenderer,
  },
  {
    tester: jsonFormsAntiScamDisclaimerBannerLayoutTester,
    renderer: jsonFormsAntiScamDisclaimerBannerLayoutRenderer,
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
    tester: jsonFormsMaxColumnsControlTester,
    renderer: JsonFormsMaxColumnsControl,
  },
  {
    tester: jsonFormsCollectionVariantControlTester,
    renderer: JsonFormsCollectionVariantControl,
  },
  {
    // NOTE: If we fall through all our previous testers,
    // we render null so that the users don't get visual noise
    tester: rankWith(JSON_FORMS_RANKING.Catchall, () => true),
    renderer: () => null,
  },
  {
    tester: jsonFormsCollectionDropdownControlTester,
    renderer: JsonFormsCollectionDropdownControl,
  },
  {
    tester: jsonFormsPrefillLinkControlTester,
    renderer: JsonFormsPrefillLinkControl,
  },
  {
    tester: jsonFormsBoxedGroupControlTester,
    renderer: JsonFormsBoxedGroupControl,
  },
]

interface FormBuilderProps<T> {
  schema: TSchema
  validateFn: ValidateFunction<T>
  data: unknown
  handleChange: (data: T) => void
}

const FormBuilder = <T,>({
  schema,
  validateFn,
  data,
  handleChange,
}: FormBuilderProps<T>): React.ReactNode => {
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

export default FormBuilder
