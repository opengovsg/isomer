import { RankedTester, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

export const jsonFormsColourPickerControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ColourPickerControl,
  schemaMatches((schema) => schema.format === "color-picker"),
)

const JsonFormsColourPickerControl = () => {
  return "hello"
}

export default withJsonFormsControlProps(JsonFormsColourPickerControl)
