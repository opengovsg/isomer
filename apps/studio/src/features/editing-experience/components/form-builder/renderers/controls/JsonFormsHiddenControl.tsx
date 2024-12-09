import type { RankedTester } from "@jsonforms/core"
import { rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

export const jsonFormsHiddenControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.HiddenControl,
  schemaMatches((schema) => schema.format === "hidden"),
)

export function JsonFormsHiddenControl() {
  return <></>
}

export default withJsonFormsControlProps(JsonFormsHiddenControl)
