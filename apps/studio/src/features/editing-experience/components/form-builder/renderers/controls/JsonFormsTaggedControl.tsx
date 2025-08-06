import { useMemo } from "react"
import {
  and,
  ArrayLayoutProps,
  ControlProps,
  findUISchema,
  RankedTester,
  rankWith,
  schemaMatches,
} from "@jsonforms/core"
import {
  JsonFormsDispatch,
  withJsonFormsArrayLayoutProps,
} from "@jsonforms/react"
import { useSetAtom } from "jotai"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { collectionItemSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"
import { tagCategoriesAtom } from "../../atoms"

export const jsonFormsTaggedControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ArrayControl,
  and(schemaMatches((schema) => schema.format === "tagged")),
)

export function JsonFormsTaggedControl({
  path,
  visible,
  schema,
  renderers,
  cells,
  uischema,
  rootSchema,
  handleChange,
}: ControlProps) {
  const { siteId, linkId, pageId } = useQueryParse(collectionItemSchema)
  // NOTE: Since this is only rendered inside a collection page or collection link,
  // we should always have the `resourceId` specifier
  const resourceId = linkId ?? pageId ?? 1
  const [tags] = trpc.collection.getCollectionTags.useSuspenseQuery({
    resourceId,
    siteId,
  })

  const setTagCategories = useSetAtom(tagCategoriesAtom)
  setTagCategories(tags)
  const childUiSchema = useMemo(
    () =>
      findUISchema(
        uischemas ?? [],
        schema,
        uischema.scope,
        path,
        undefined,
        uischema,
        rootSchema,
      ),
    [uischemas, schema, uischema, path, rootSchema],
  )

  console.log(rootSchema, "roote")

  return (
    <div>
      <p>hello</p>
      <JsonFormsDispatch
        renderers={renderers}
        cells={cells}
        visible={visible}
        schema={schema}
        uischema={uischema}
        path={path}
      />
    </div>
  )
}

export default withJsonFormsControlProps(JsonFormsTaggedControl)
