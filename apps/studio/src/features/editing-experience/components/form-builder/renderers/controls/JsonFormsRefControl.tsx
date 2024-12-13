import type { ControlProps, RankedTester } from "@jsonforms/core"
import { and, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { omit } from "lodash"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { LINK_TYPES, LINK_TYPES_MAPPING } from "../../../LinkEditor/constants"
import { BaseLinkControl } from "./BaseLinkControl"

export const jsonFormsRefControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.RefControl,
  and(schemaMatches((schema) => schema.format === "ref")),
)

export function JsonFormsRefControl({
  data,
  handleChange,
  path,
  label,
}: ControlProps) {
  return (
    <BaseLinkControl
      data={data as string}
      label={label}
      handleChange={handleChange}
      path={path}
      linkTypes={omit(LINK_TYPES_MAPPING, LINK_TYPES.Email)}
      description="Choose a page or file to link this Collection item to"
    />
  )
}

export default withJsonFormsControlProps(JsonFormsRefControl)
