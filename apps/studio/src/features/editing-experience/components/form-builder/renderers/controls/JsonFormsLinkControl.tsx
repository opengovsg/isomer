import type { ControlProps, RankedTester } from "@jsonforms/core"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { LINK_TYPES_MAPPING } from "../../../LinkEditor/constants"
import { BaseLinkControl } from "./BaseLinkControl"

export const jsonFormsLinkControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.LinkControl,
  and(
    isStringControl,
    schemaMatches((schema) => schema.format === "link"),
  ),
)

export function JsonFormsLinkControl({
  data,
  label,
  handleChange,
  path,
  required,
}: ControlProps) {
  return (
    <BaseLinkControl
      data={data as string}
      label={label}
      required={required}
      handleChange={handleChange}
      path={path}
      linkTypes={LINK_TYPES_MAPPING}
      description="Link a page, file, external URL, or an email address"
    />
  )
}

export default withJsonFormsControlProps(JsonFormsLinkControl)
