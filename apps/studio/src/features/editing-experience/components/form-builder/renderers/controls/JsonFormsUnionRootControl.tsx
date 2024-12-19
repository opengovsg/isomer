import type { ControlElement, RankedTester } from "@jsonforms/core"
import React from "react"
import { rankWith } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { isVerticalLayout } from "~/types/schema"

// This sometimes happens when we are using Union types in the schema.
// Needed to return <></> instead of the default Control renderer
// to ensure that there's no additional gaps in the form.
export const jsonFormsUnionRootControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.UnionRootControl,
  (uischema, schema) => {
    if (schema.type !== "string") {
      return false
    }

    const newElements = isVerticalLayout(uischema) ? uischema.elements : []
    return (
      newElements.length === 1 &&
      newElements[0]?.type === "Control" &&
      (newElements[0] as ControlElement).scope === "#"
    )
  },
)

export function JsonFormsUnionRootControl() {
  return <></>
}

export default withJsonFormsControlProps(JsonFormsUnionRootControl)
