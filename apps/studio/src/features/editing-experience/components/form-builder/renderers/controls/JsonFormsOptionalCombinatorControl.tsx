import type {
  ControlWithDetailProps,
  JsonSchema,
  RankedTester,
  UISchemaElement,
} from "@jsonforms/core"
import { FormControl, HStack, Text, VStack } from "@chakra-ui/react"
import {
  and,
  decode,
  findUISchema,
  Generate,
  hasType,
  isAnyOfControl,
  isControl,
  isOneOfControl,
  or,
  rankWith,
  resolveSchema,
  schemaMatches,
} from "@jsonforms/core"
import { JsonFormsDispatch } from "@jsonforms/react"
import { Switch } from "@opengovsg/design-system-react"
import isEmpty from "lodash/isEmpty"
import { useMemo, useState } from "react"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

import { withJsonFormsControlWithDetailProps } from "../../contexts/JsonFormsContext"

/** Inverse of JsonForms' internal isRequired — same inputs as mapStateToControlProps. */
function isControlPropertyOptional(
  uischema: UISchemaElement,
  dataSchema: JsonSchema,
  rootSchema: JsonSchema,
): boolean {
  if (!isControl(uischema) || !hasType(dataSchema, "object")) {
    return false
  }
  const segments = uischema.scope.split("/")
  const prop = decode(segments.at(-1) ?? "")
  const parent = resolveSchema(
    dataSchema,
    segments.slice(0, -2).join("/"),
    rootSchema,
  )
  return !parent?.required?.includes(prop)
}

/** Object-shape unions only (JsonForms’ hasType), not primitive / enum oneOfs. */
function combinatorIsObjectVariantUnion(schema: JsonSchema): boolean {
  const variants = schema.anyOf ?? schema.oneOf
  return (
    Array.isArray(variants) &&
    variants.length > 0 &&
    variants.every(
      (branch) => branch !== undefined && hasType(branch, "object"),
    )
  )
}

export const jsonFormsOptionalCombinatorControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.OptionalCombinatorControl,
  and(
    or(isAnyOfControl, isOneOfControl),
    schemaMatches((resolved) => combinatorIsObjectVariantUnion(resolved)),
    (uischema, dataSchema, context) =>
      isControlPropertyOptional(uischema, dataSchema, context.rootSchema),
  ),
)

function JsonFormsOptionalCombinatorControl({
  data,
  path,
  visible,
  renderers,
  cells,
  schema,
  enabled,
  label,
  description,
  required,
  uischema,
  uischemas,
  rootSchema,
  handleChange,
}: ControlWithDetailProps) {
  const toggleLabelDesc = useMemo(() => {
    const segments = uischema.scope.split("/")

    // Only apply when this control is a direct child of root:
    // `#/properties/<prop>`
    if (segments.length !== 3) {
      return { label, description }
    }

    const parent = resolveSchema(rootSchema, "#", rootSchema)
    return {
      label: parent?.title ?? label,
      description: parent?.description ?? description,
    }
  }, [description, label, rootSchema, uischema.scope])

  const detailUiSchema = useMemo(
    () =>
      findUISchema(
        uischemas ?? [],
        schema,
        uischema.scope,
        path,
        () =>
          Generate.uiSchema(schema, "VerticalLayout", undefined, rootSchema),
        uischema,
        rootSchema,
      ),
    [uischemas, schema, uischema, path, rootSchema],
  )

  const [isChecked, setIsChecked] = useState(!isEmpty(data))
  // oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [dataSnapshot, setDataSnapshot] = useState(data)

  const handleToggle = () => {
    if (isChecked) {
      setDataSnapshot(data)
      handleChange(path, undefined)
    } else {
      handleChange(path, dataSnapshot)
    }
    setIsChecked((prev) => !prev)
  }

  if (!visible) {
    return null
  }

  if (!required) {
    return (
      <HStack spacing="0.5rem" alignItems="flex-start" w="full">
        <VStack w="full" gap="0.75rem" pt="0.5rem" alignItems="start">
          <HStack alignItems="space-between" w="full" spacing="1rem">
            <FormControl
              display="flex"
              alignItems="center"
              isDisabled={!enabled}
            >
              <VStack gap="0.25rem" alignItems="start">
                <Text textStyle="subhead-1" textColor="base.content.strong">
                  {toggleLabelDesc.label}
                </Text>

                {toggleLabelDesc.description && (
                  <Text textStyle="body-2" textColor="base.content.strong">
                    {toggleLabelDesc.description}
                  </Text>
                )}
              </VStack>
            </FormControl>

            <Switch
              size="md"
              isChecked={isChecked}
              onChange={handleToggle}
              isDisabled={!enabled}
            />
          </HStack>

          {isChecked && (
            <JsonFormsDispatch
              visible={visible}
              enabled={enabled && isChecked}
              schema={schema}
              uischema={detailUiSchema}
              path={path}
              renderers={renderers}
              cells={cells}
            />
          )}
        </VStack>
      </HStack>
    )
  }

  return (
    <JsonFormsDispatch
      visible={visible}
      enabled={enabled}
      schema={schema}
      uischema={detailUiSchema}
      path={path}
      renderers={renderers}
      cells={cells}
    />
  )
}

export default withJsonFormsControlWithDetailProps(
  JsonFormsOptionalCombinatorControl,
)
