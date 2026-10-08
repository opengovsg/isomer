import type { CombinatorRendererProps, RankedTester } from "@jsonforms/core"
import {
  and,
  createCombinatorRenderInfos,
  isAllOfControl,
  rankWith,
  schemaMatches,
} from "@jsonforms/core"
import { JsonFormsDispatch, withJsonFormsAllOfProps } from "@jsonforms/react"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

export const jsonFormsAllOfControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.AllOfControl,
  and(
    isAllOfControl,
    // `IsomerString` puts the shared unicode check in `allOf`. That is a
    // constraint on the string, not a combinator field. Object intersects
    // (collection page settings) still use this control.
    schemaMatches((schema) => schema.type !== "string"),
  ),
)

function JsonFormsAllOfControl({
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
