import { Box, VStack } from '@chakra-ui/react'
import {
  rankWith,
  uiTypeIs,
  type LayoutProps,
  type RankedTester,
  type UISchemaElement,
  type VerticalLayout,
} from '@jsonforms/core'
import { JsonFormsDispatch, withJsonFormsLayoutProps } from '@jsonforms/react'
import { JSON_FORMS_RANKING } from '~/constants/formBuilder'
import { type IsomerJsonSchema } from '~/types/schema'

interface UISchemaElementWithScope extends UISchemaElement {
  scope?: string
  label?: string
  elements?: UISchemaElementWithScope[]
}

export const jsonFormsVerticalLayoutTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.VerticalLayoutRenderer,
  uiTypeIs('VerticalLayout'),
)

function getUiSchemaWithGroup(
  jsonSchema: IsomerJsonSchema,
  uiSchema: UISchemaElementWithScope[],
) {
  const { groups } = jsonSchema
  const groupMap = new Map<string, string[]>()

  if (!groups) {
    return uiSchema
  }

  // Identify all the properties that have groups
  groups.forEach(({ label, fields }) => {
    groupMap.set(label, fields)
  })

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
      propertiesNotInGroup.includes(element.scope.split('/').pop() || '')
    ) {
      newUiSchema.push(element)
      return
    }

    const group = groups.find(({ fields }) =>
      fields.includes(element.scope?.split('/').pop() || ''),
    )

    if (group) {
      const { label } = group
      const groupFields = groupMap.get(label) || []
      const groupElements = uiSchema.filter((el) =>
        groupFields.includes(el.scope?.split('/').pop() || ''),
      )

      newUiSchema.push({
        type: 'Group',
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
  const { elements } = uischema as VerticalLayout
  const newElements = getUiSchemaWithGroup(
    schema as IsomerJsonSchema,
    elements as UISchemaElementWithScope[],
  )

  return (
    <VStack spacing={2}>
      {newElements.map((element, index) => (
        // eslint-disable-next-line react/no-array-index-key
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
