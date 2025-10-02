import type {
  ControlWithDetailProps,
  JsonSchema,
  RankedTester,
} from "@jsonforms/core"
import { useMemo } from "react"
import { Box, Collapse, Flex, Spacer, Text, VStack } from "@chakra-ui/react"
import {
  findUISchema,
  Generate,
  rankWith,
  schemaMatches,
} from "@jsonforms/core"
import { JsonFormsDispatch } from "@jsonforms/react"
import { Switch } from "@opengovsg/design-system-react"
import { filter } from "lodash"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import {
  useWidget,
  WIDGET_CONFIG,
  WidgetType,
} from "../../contexts/WidgetContext"

const isSchemaWithVariant = (
  schema: JsonSchema,
): schema is JsonSchema & { variant: WidgetType } => {
  return (schema as { variant?: WidgetType }).variant !== undefined
}

export const jsonFormsWidgetIntegrationControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.WidgetControl,
  schemaMatches((schema) => schema.format === "widget-integration"),
)

export function JsonFormsWidgetIntegrationControl({
  path,
  schema,
  rootSchema,
  uischema,
  uischemas,
  cells,
  renderers,
  enabled,
}: ControlWithDetailProps) {
  const { activeWidget, setActiveWidget, getNextWidget } = useWidget()

  if (!isSchemaWithVariant(schema) || !schema.variant) {
    return <></>
  }

  const variant = schema.variant
  const isChecked = activeWidget === variant

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

  const handleToggle = () => {
    const next = isChecked ? null : getNextWidget(variant)
    setActiveWidget(next)
  }

  const { icon, label: widgetLabel } = WIDGET_CONFIG[variant]

  const otherWidgets = filter(WIDGET_CONFIG, (_v, k) => k !== variant)
  const otherLabels = otherWidgets.map((widget) => widget.label).join(", ")

  return (
    <>
      <VStack gap="0.5rem" alignItems="flex-start">
        <Box>{icon}</Box>
        <Flex w="full">
          <Box>
            <Text textStyle="subhead-2">{`${widgetLabel} is enabled on this website`}</Text>
            <Text textStyle="body-2">{`You can't enable ${otherLabels} if you enable ${widgetLabel}`}</Text>
          </Box>
          <Spacer />
          <Switch isChecked={isChecked} onChange={handleToggle} />
        </Flex>
      </VStack>
      {/* NOTE: we need this box because we want it to take up space */}
      {/* so that we don't have a adjusting block */}
      <Box display={isChecked ? "block" : "none"} width="100%">
        <Collapse in={isChecked} animateOpacity unmountOnExit={false}>
          {/* NOTE: Continue to dispatch downwards after injecting heading */}
          {isChecked && (
            <JsonFormsDispatch
              uischema={detailUiSchema}
              schema={schema}
              path={path}
              enabled={enabled}
              renderers={renderers}
              cells={cells}
            />
          )}
        </Collapse>
      </Box>
    </>
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

export default withJsonFormsControlWithDetailProps(
  JsonFormsWidgetIntegrationControl,
)
