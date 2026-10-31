import type {
  ControlProps,
  JsonFormsRendererRegistryEntry,
} from "@jsonforms/core"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

import { LINK_TYPES_MAPPING } from "../../../../LinkEditor/constants"
import { useBuilderErrors } from "../../../ErrorProvider"
import { BaseLinkControl } from "../BaseLinkControl"
import { getBuilderFieldErrorMessage } from "./getBuilderFieldErrorMessage"

// JsonForms drops link field errors under nested hero combinator schemas (same as text).
// Only registered inside JsonFormsHeroActionLayoutControl, not globally.
const ActionLayoutLinkControl = ({
  data,
  label,
  handleChange,
  path,
  required,
  errors: jsonFormsErrors,
}: ControlProps) => {
  const { errors: builderErrors } = useBuilderErrors()
  const errors =
    jsonFormsErrors || getBuilderFieldErrorMessage(path, builderErrors) || ""

  return (
    <BaseLinkControl
      data={data as string}
      label={label}
      required={required}
      handleChange={handleChange}
      path={path}
      linkTypes={LINK_TYPES_MAPPING}
      description="Link a page, file, external URL, or an email address"
      errors={errors}
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
