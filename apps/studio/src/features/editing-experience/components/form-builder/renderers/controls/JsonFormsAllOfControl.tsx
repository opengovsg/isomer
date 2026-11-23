import type { CombinatorRendererProps, RankedTester } from "@jsonforms/core"
import {
  createCombinatorRenderInfos,
  isAllOfControl,
  rankWith,
} from "@jsonforms/core"
import { JsonFormsDispatch, withJsonFormsAllOfProps } from "@jsonforms/react"
import { useMemo } from "react"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

export const jsonFormsAllOfControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.AllOfControl,
  isAllOfControl,
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
  // NOTE: Memoised as each call generates a new uischema, which re-renders
  // every descendant control
  const allOfRenderInfos = useMemo(
    () =>
      createCombinatorRenderInfos(
        schema.allOf ?? [],
        rootSchema,
        "allOf",
        uischema,
        path,
        uischemas,
      ),
    [schema, rootSchema, uischema, path, uischemas],
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
