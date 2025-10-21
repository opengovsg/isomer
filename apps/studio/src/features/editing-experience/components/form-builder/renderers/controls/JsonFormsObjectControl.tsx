import type { ControlWithDetailProps, RankedTester } from "@jsonforms/core"
import type { JsonFormsStateContext } from "@jsonforms/react"
import type { ComponentType } from "react"
import { memo, useLayoutEffect, useMemo, useState } from "react"
import { FormControl, HStack, Text, VStack } from "@chakra-ui/react"
import {
  findUISchema,
  Generate,
  isObjectControl,
  rankWith,
} from "@jsonforms/core"
import {
  ctxDispatchToControlProps,
  ctxToControlWithDetailProps,
  JsonFormsDispatch,
  withJsonFormsContext,
} from "@jsonforms/react"
import { Switch } from "@opengovsg/design-system-react"
import isEmpty from "lodash/isEmpty"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

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

  useLayoutEffect(() => {
    if (isEmpty(data)) {
      handleChange(path, undefined)
    }
  })

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

// NOTE: This is a custom handrolled higher order component.
// It is needed to provide both `uischemas` as well as the `handleChange` prop.
// The implementation here is taken with reference from:
// https://github.com/eclipsesource/jsonforms/blob/f815e1cde8794380d59e55c34beff17cf0ffb565/packages/react/src/JsonFormsContext.tsx
const withJsonFormsControlWithDetailProps = (
  Component: ComponentType<ControlWithDetailProps>,
) => {
  return withJsonFormsContext(
    withContextToControlWithDetailProps(memo(Component)),
  )
}

const withContextToControlWithDetailProps = (
  Component: ComponentType<ControlWithDetailProps>,
) =>
  function WithContextToControlProps({
    ctx,
    props,
  }: JsonFormsStateContext & ControlWithDetailProps) {
    // NOTE: provides `handleChange` for our method.
    // Unfortunately, the `ctx` is typed as `any` here
    // and requires suppression.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    const dispatchProps = ctxDispatchToControlProps(ctx.dispatch)
    // NOTE: provides `uischemas, renderers, cells`
    // The previous implementation of using `withJsonFormsDetailProps`
    // only provided this.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const detailProps = ctxToControlWithDetailProps(ctx, props)
    return <Component {...props} {...dispatchProps} {...detailProps} />
  }

export default withJsonFormsControlWithDetailProps(JsonFormsObjectControl)
