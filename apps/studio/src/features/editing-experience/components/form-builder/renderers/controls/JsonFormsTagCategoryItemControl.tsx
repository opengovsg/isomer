import type { CombinatorRendererProps, RankedTester } from "@jsonforms/core"
import { findUISchema, rankWith, schemaMatches } from "@jsonforms/core"
import { JsonFormsDispatch, withJsonFormsOneOfProps } from "@jsonforms/react"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

export const jsonFormsTagCategoryItemControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.TagCategoryItemControl,
  schemaMatches((schema) => schema.format === "tag-category-item"),
)

// Bypasses JsonFormsCombinatorControl — JSONForms' generic `oneOf` renderer,
// which always shows a "Variant" picker letting the admin choose a branch.
// A tagCategories entry's type is already decided by the type-choice modal
// on creation, so there's nothing to pick here: we just dispatch straight to
// whichever branch `indexOfFittingSchema` (JSONForms' own AJV-based match)
// already resolved for the current data.
function JsonFormsTagCategoryItemControl({
  schema,
  uischema,
  uischemas,
  path,
  rootSchema,
  renderers,
  cells,
  visible,
  indexOfFittingSchema,
}: CombinatorRendererProps) {
  const branches = schema.oneOf ?? []
  const matchedSchema = branches[indexOfFittingSchema] ?? branches[0]

  if (!matchedSchema) {
    return null
  }

  const childUiSchema = findUISchema(
    uischemas,
    matchedSchema,
    uischema.scope,
    path,
    undefined,
    uischema,
    rootSchema,
  )

  return (
    <JsonFormsDispatch
      schema={matchedSchema}
      uischema={childUiSchema}
      path={path}
      renderers={renderers}
      cells={cells}
      visible={visible}
    />
  )
}

export default withJsonFormsOneOfProps(JsonFormsTagCategoryItemControl)
