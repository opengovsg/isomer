import type {
  LayoutProps,
  RankedTester,
  UISchemaElement,
} from "@jsonforms/core"
import { Box } from "@chakra-ui/react"
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

  const propertiesNotInGroup = Object.keys(jsonSchema.properties ?? {}).filter(
    (property) => !groups.some(({ fields }) => fields.includes(property)),
  )

  let tempUiSchema = [...uiSchema]
  const newUiSchema: UISchemaElementWithScope[] = []

  let count = 0

  while (count < uiSchema.length) {
    const element = tempUiSchema[0]

    if (!element) {
      // This shouldn't happen as we will always need to process all elements
      break
    }

    if (
      element.scope === undefined ||
      propertiesNotInGroup.includes(element.scope.split("/").pop() || "")
    ) {
      newUiSchema.push(element)
      tempUiSchema = tempUiSchema.slice(1)
      count++
      continue
    }

    const group = groups.find(({ fields }) =>
      fields.includes(element.scope?.split("/").pop() || ""),
    )

    if (group) {
      const { label } = group
      const groupFields = groupMap.get(label) ?? []
      const groupElements = uiSchema.filter((el) =>
        groupFields.includes(el.scope?.split("/").pop() || ""),
      )

      newUiSchema.push({
        type: "Group",
        label,
        elements: groupElements,
      })

      tempUiSchema = tempUiSchema.filter(
        (el) => !groupElements.some((el2) => el.scope === el2.scope),
      )
      count += groupElements.length
    }
  }

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
    <Box w="100%" display="flex" flexDirection="column" gap="1.25rem" h="full">
      {newElements.map((element, index) => (
        <JsonFormsDispatch
          key={`${path}-${index}`}
          uischema={element}
          schema={schema}
          path={path}
          enabled={enabled}
          renderers={renderers}
          cells={cells}
        />
      ))}
    </Box>
  )
}

export default withJsonFormsLayoutProps(JsonFormsVerticalLayoutRenderer)
