/* oxlint-disable unicorn/no-useless-undefined -- JSON Forms handleChange requires explicit undefined */
import type { ControlWithDetailProps, RankedTester } from "@jsonforms/core"
import { Box, FormControl, HStack, Text, VStack } from "@chakra-ui/react"
import {
  and,
  findUISchema,
  Generate,
  isObjectControl,
  rankWith,
  schemaMatches,
} from "@jsonforms/core"
import { JsonFormsDispatch } from "@jsonforms/react"
import { Switch } from "@opengovsg/design-system-react"
import { isEmpty } from "lodash-es"
import { useMemo, useRef, useState } from "react"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import {
  hasNonEmptyString,
  isDefinedNumber,
  isNullableBooleanTrue,
  isNonEmptyArray,
} from "~/utils/truthiness"

import { withJsonFormsControlWithDetailProps } from "../../contexts/JsonFormsContext"

export const jsonFormsBoxedGroupControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.BoxedGroupControl,
  and(
    isObjectControl,
    schemaMatches((schema) => schema.format === "boxedGroup"),
  ),
)

const JsonFormsBoxedGroupControl = ({
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
}: ControlWithDetailProps) => {
  const [isChecked, setIsChecked] = useState(!isEmpty(data))
  const dataSnapshotRef = useRef(data)
  const handleToggle = () => {
    if (isChecked) {
      dataSnapshotRef.current = data
      handleChange(path, undefined)
    } else {
      handleChange(path, dataSnapshotRef.current)
    }
    setIsChecked((prev) => !prev)
  }
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

  if (!visible) {
    return null
  }

  if (!isNullableBooleanTrue(required)) {
    return (
      <HStack spacing="0.5rem" alignItems="flex-start" w="full">
        <VStack w="full" gap="1rem" pt="0.5rem" alignItems="start">
          <HStack alignItems="space-between" w="full" spacing="1rem">
            <FormControl
              display="flex"
              alignItems="center"
              isDisabled={!enabled}
            >
              <VStack gap="0.25rem" alignItems="start">
                <Text textStyle="subhead-1" textColor="base.content.strong">
                  {label}
                </Text>

                {hasNonEmptyString(description) && (
                  <Text textStyle="body-2" textColor="base.content.strong">
                    {description}
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
            <Box
              border="1px solid"
              borderColor="base.divider.medium"
              borderRadius="0.375rem"
              p="1.25rem"
              w="full"
              bg="rgba(255, 255, 255, 0.50)"
            >
              <JsonFormsDispatch
                visible={visible}
                enabled={enabled && isChecked}
                schema={schema}
                uischema={detailUiSchema}
                path={path}
                renderers={renderers}
                cells={cells}
              />
            </Box>
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

export default withJsonFormsControlWithDetailProps(JsonFormsBoxedGroupControl)
