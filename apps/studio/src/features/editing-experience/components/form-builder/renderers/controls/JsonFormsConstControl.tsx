/* oxlint-disable unicorn/no-useless-undefined -- JSON Forms handleChange requires explicit undefined */
import type { RankedTester } from "@jsonforms/core"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

export const jsonFormsConstControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ConstControl,
  and(
    isStringControl,
    schemaMatches((schema) => schema.const !== undefined),
  ),
)

const JsonFormsConstControl = () => null

export default withJsonFormsControlProps(JsonFormsConstControl)
