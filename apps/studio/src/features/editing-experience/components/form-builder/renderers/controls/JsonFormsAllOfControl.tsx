import type { CombinatorRendererProps, RankedTester } from "@jsonforms/core"
import { Box } from "@chakra-ui/react"
import {
  createCombinatorRenderInfos,
  isAllOfControl,
  rankWith,
} from "@jsonforms/core"
import { JsonFormsDispatch, withJsonFormsAllOfProps } from "@jsonforms/react"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

export const jsonFormsAllOfControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.AllOfControl,
  isAllOfControl,
)

export function JsonFormsAllOfControl({
  schema,
  path,
  renderers,
  cells,
  rootSchema,
  uischema,
  uischemas,
}: CombinatorRendererProps) {
  const allOfRenderInfos = createCombinatorRenderInfos(
    schema.allOf ?? [],
    rootSchema,
    "allOf",
    uischema,
    path,
    uischemas,
  )

  return (
    <>
      {allOfRenderInfos.map((allOfRenderInfo) => (
        <JsonFormsDispatch
          key={allOfRenderInfo.label}
          uischema={allOfRenderInfo.uischema}
          schema={allOfRenderInfo.schema}
          path={path}
          renderers={renderers}
          cells={cells}
        />
      ))}
    </>
  )
}

export default withJsonFormsAllOfProps(JsonFormsAllOfControl)
