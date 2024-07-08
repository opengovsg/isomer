import type {
  LayoutProps,
  RankedTester,
  UISchemaElement,
} from "@jsonforms/core"
import { Box, VStack } from "@chakra-ui/react"
import { rankWith, uiTypeIs } from "@jsonforms/core"
import { JsonFormsDispatch, withJsonFormsLayoutProps } from "@jsonforms/react"

import type { IsomerExtendedJsonSchema } from "~/types/schema"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { isVerticalLayout } from "~/types/schema"

type UISchemaElementWithScope = UISchemaElement & {
  scope?: string
  label?: string
  elements?: UISchemaElementWithScope[]
}

export const jsonFormsVerticalLayoutTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.VerticalLayoutRenderer,
  uiTypeIs("VerticalLayout"),
)

function getUiSchemaWithGroup(
  jsonSchema: IsomerExtendedJsonSchema,
  uiSchema: UISchemaElementWithScope[],
) {
  const { groups } = jsonSchema

  if (!groups) {
    return uiSchema
  }

  const groupMap = new Map<string, string[]>(
    new Map(groups.map(({ label, fields }) => [label, fields])),
  )

  const propertiesNotInGroup = Object.keys(jsonSchema.properties || {}).filter(
    (property) => !groups.some(({ fields }) => fields.includes(property)),
  )

  const tempUiSchema = [...uiSchema]
  const newUiSchema: UISchemaElementWithScope[] = []

  // Iterate through the UI schema and combine properties that belong to the
  // same group, while preserving the original order of the schema
  tempUiSchema.forEach((element) => {
    if (
      element.scope === undefined ||
      propertiesNotInGroup.includes(element.scope.split("/").pop() || "")
    ) {
      newUiSchema.push(element)
      return
    }

    const group = groups.find(({ fields }) =>
      fields.includes(element.scope?.split("/").pop() || ""),
    )

    if (group) {
      const { label } = group
      const groupFields = groupMap.get(label) || []
      const groupElements = uiSchema.filter((el) =>
        groupFields.includes(el.scope?.split("/").pop() || ""),
      )

      newUiSchema.push({
        type: "Group",
        label,
        elements: groupElements,
      })

      groupElements.forEach((el) => {
        const index = tempUiSchema.indexOf(el)
        tempUiSchema.splice(index, 1)
      })
    }
  })

  return newUiSchema
}

export function JsonFormsVerticalLayoutRenderer({
  uischema,
  schema,
  path,
  enabled,
  renderers,
  cells,
}: LayoutProps) {
  // Note: We have to perform this check here due to inaccuracies in JSONForms'
  // type definitions.
  // Ref: https://github.com/eclipsesource/jsonforms/blob/c3cead71d08ff11837bdeb5fbea66e5313137218/packages/material-renderers/src/layouts/MaterialVerticalLayout.tsx#L57
  const elements = isVerticalLayout(uischema) ? uischema.elements : []
  const newElements = getUiSchemaWithGroup(schema, elements)

  return (
    <VStack spacing={2}>
      {newElements.map((element, index) => (
        <Box key={`${path}-${index}`} w="100%">
          <JsonFormsDispatch
            uischema={element}
            schema={schema}
            path={path}
            enabled={enabled}
            renderers={renderers}
            cells={cells}
          />
        </Box>
      ))}
    </VStack>
  )
}

export default withJsonFormsLayoutProps(JsonFormsVerticalLayoutRenderer)
