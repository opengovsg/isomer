import type { ControlProps, RankedTester } from "@jsonforms/core"
import { useEffect } from "react"
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

export function JsonFormsConstControl({
  handleChange,
  path,
  schema,
}: ControlProps) {
  // TODO: Make the default value persist inside JSONForms
  useEffect(() => {
    handleChange(path, schema.const)
  }, [handleChange, path, schema])

  return null
}

export default withJsonFormsControlProps(JsonFormsConstControl)
