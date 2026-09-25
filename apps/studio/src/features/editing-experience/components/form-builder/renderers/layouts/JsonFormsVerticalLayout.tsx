import type {
  LayoutProps,
  RankedTester,
  UISchemaElement,
} from "@jsonforms/core"
import type { FieldVisibleWhen, IsomerExtendedJsonSchema } from "~/types/schema"
import { Box } from "@chakra-ui/react"
import { createAjv, rankWith, RuleEffect, uiTypeIs } from "@jsonforms/core"
import { JsonFormsDispatch, withJsonFormsLayoutProps } from "@jsonforms/react"
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

const ajv = createAjv()

const showWhenRootMatches = (visibleWhen: FieldVisibleWhen) => ({
  effect: RuleEffect.SHOW,
  condition: {
    validate: ({ fullData }: { fullData: unknown }) => {
      if (typeof fullData !== "object" || fullData === null) {
        return false
      }

      const value = (fullData as Record<string, unknown>)[visibleWhen.property]
      return ajv.validate(visibleWhen.schema, value)
    },
  },
})

function withFieldVisibility(
  jsonSchema: IsomerExtendedJsonSchema,
  uiSchema: UISchemaElementWithScope[],
) {
  const properties = jsonSchema.properties ?? {}

  return uiSchema.map((element) => {
    const propertyName = element.scope?.split("/").pop()
    const visibleWhen = propertyName
      ? properties[propertyName]?.visibleWhen
      : undefined

    if (!visibleWhen?.root) {
      return element
    }

    return {
      ...element,
      rule: showWhenRootMatches(visibleWhen),
    }
  })
}

function getUiSchemaWithGroup(
  jsonSchema: IsomerExtendedJsonSchema,
  uiSchema: UISchemaElementWithScope[],
) {
  const { groups } = jsonSchema
  const elements = withFieldVisibility(jsonSchema, uiSchema)

  if (!groups) {
    return elements
  }

  const groupMap = new Map<string, string[]>(
    new Map(groups.map(({ label, fields }) => [label, fields])),
  )

  const propertiesNotInGroup = Object.keys(jsonSchema.properties ?? {}).filter(
    (property) => !groups.some(({ fields }) => fields.includes(property)),
  )

  let tempUiSchema = [...elements]
  const newUiSchema: UISchemaElementWithScope[] = []

  let count = 0

  while (count < elements.length) {
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
      const groupElements = elements.filter((el) =>
        groupFields.includes(el.scope?.split("/").pop() || ""),
      )

      newUiSchema.push({
        type: "Group",
        label,
        elements: groupElements,
        rule: group.visibleWhen
          ? {
              effect: RuleEffect.SHOW,
              condition: {
                scope: `#/properties/${group.visibleWhen.property}`,
                schema: group.visibleWhen.schema,
              },
            }
          : undefined,
      })

      tempUiSchema = tempUiSchema.filter(
        (el) => !groupElements.some((el2) => el.scope === el2.scope),
      )
      count += groupElements.length
    }
  }

  return newUiSchema
}

function JsonFormsVerticalLayoutRenderer({
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
  const newElements = getUiSchemaWithGroup(
    schema,
    elements as UISchemaElementWithScope[],
  )

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
