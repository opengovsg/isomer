import type { ControlWithDetailProps, RankedTester } from "@jsonforms/core"
import { useMemo, useState } from "react"
import { FormControl, HStack, Text, VStack } from "@chakra-ui/react"
import {
  findUISchema,
  Generate,
  isObjectControl,
  rankWith,
} from "@jsonforms/core"
import { JsonFormsDispatch } from "@jsonforms/react"
import { Switch } from "@opengovsg/design-system-react"
import isEmpty from "lodash/isEmpty"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { withJsonFormsControlWithDetailProps } from "../../contexts/JsonFormsContext"

export const jsonFormsObjectControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ObjectControl,
  isObjectControl,
)

export function JsonFormsObjectControl({
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
  const [isChecked, setIsChecked] = useState(!isEmpty(data))
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

  if (!required) {
    return (
      <HStack spacing="0.5rem" alignItems="flex-start">
        <VStack w="full" gap="0.75rem" pt="0.5rem" alignItems="start">
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

                {description && (
                  <Text textStyle="body-2" textColor="base.content.strong">
                    {description}
                  </Text>
                )}
              </VStack>
            </FormControl>

            <Switch
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

export default withJsonFormsControlWithDetailProps(JsonFormsObjectControl)
