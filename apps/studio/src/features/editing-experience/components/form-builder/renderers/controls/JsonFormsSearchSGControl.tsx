import type { CombinatorRendererProps, RankedTester } from "@jsonforms/core"
import { Box } from "@chakra-ui/react"
import {
  createCombinatorRenderInfos,
  rankWith,
  schemaMatches,
} from "@jsonforms/core"
import { JsonFormsDispatch, withJsonFormsAnyOfProps } from "@jsonforms/react"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

export const jsonFormsSearchSGControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.SearchSGControl,
  schemaMatches((schema) => schema.format === "searchsg"),
)

export function JsonFormsSearchSGControl({
  schema,
  path,
  renderers,
  cells,
  rootSchema,
  uischema,
  uischemas,
}: CombinatorRendererProps) {
  const anyOfRenderInfos = createCombinatorRenderInfos(
    schema.anyOf ?? [],
    rootSchema,
    "anyOf",
    uischema,
    path,
    uischemas,
  )

  const searchsgRenderInfo = anyOfRenderInfos.find(
    (info) => info.schema.properties?.type?.const === "searchSG",
  )

  return (
    searchsgRenderInfo && (
      // NOTE: Outer `Box` because we hook into `VerticalLayout`
      // down the line, which sets `h=full`
      <Box>
        <JsonFormsDispatch
          enabled={false}
          schema={searchsgRenderInfo.schema}
          key={searchsgRenderInfo.label}
          uischema={searchsgRenderInfo.uischema}
          path={path}
          renderers={renderers}
          cells={cells}
        />
      </Box>
    )
  )
}

export default withJsonFormsAnyOfProps(JsonFormsSearchSGControl)
