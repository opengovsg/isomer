import type {
  ControlProps,
  JsonFormsRendererRegistryEntry,
} from "@jsonforms/core"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

import { useBuilderErrors } from "../../../ErrorProvider"
import JsonFormsLinkControl from "../JsonFormsLinkControl"
import { getBuilderFieldErrorMessage } from "./getBuilderFieldErrorMessage"

// JsonForms drops link field errors under nested hero combinator schemas (same as text).
// Only registered inside JsonFormsHeroActionLayoutControl, not globally.
const ActionLayoutLinkControl = (props: ControlProps) => {
  const { errors } = useBuilderErrors()

  return (
    <JsonFormsLinkControl
      {...props}
      errors={
        props.errors || getBuilderFieldErrorMessage(props.path, errors) || ""
      }
    />
  )
}

export const actionLayoutLinkRenderer: JsonFormsRendererRegistryEntry = {
  tester: rankWith(
    JSON_FORMS_RANKING.LinkControl + 1,
    and(
      isStringControl,
      schemaMatches((schema) => schema.format === "link"),
    ),
  ),
  renderer: withJsonFormsControlProps(ActionLayoutLinkControl),
}
