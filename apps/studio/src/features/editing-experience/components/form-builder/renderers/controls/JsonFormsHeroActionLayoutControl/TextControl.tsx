import type {
  ControlProps,
  JsonFormsRendererRegistryEntry,
} from "@jsonforms/core"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

import { useBuilderErrors } from "../../../ErrorProvider"
import { JsonFormsTextControl } from "../JsonFormsTextControl"
import { getBuilderFieldErrorMessage } from "./getBuilderFieldErrorMessage"

// JsonForms drops field errors under the hero banner style oneOf, so plain text
// fields in the action layout read them from the builder instead.
// Only registered inside JsonFormsHeroActionLayoutControl, not globally.
const ActionLayoutTextControl = (props: ControlProps) => {
  const { errors } = useBuilderErrors()

  return (
    <JsonFormsTextControl
      {...props}
      errors={
        props.errors || getBuilderFieldErrorMessage(props.path, errors) || ""
      }
    />
  )
}

export const actionLayoutTextRenderer: JsonFormsRendererRegistryEntry = {
  tester: rankWith(
    JSON_FORMS_RANKING.TextControl + 1,
    and(
      isStringControl,
      // Leave const fields (e.g. actions.layout) to JsonFormsConstControl.
      schemaMatches(
        (schema) => schema.format === undefined && schema.const === undefined,
      ),
    ),
  ),
  renderer: withJsonFormsControlProps(ActionLayoutTextControl),
}
