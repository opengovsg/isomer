import type { ControlWithDetailProps, RankedTester } from "@jsonforms/core"
import { useEffect, useMemo, useState } from "react"
import { Box, Collapse, Flex, Spacer, Text, VStack } from "@chakra-ui/react"
import {
  findUISchema,
  Generate,
  rankWith,
  schemaMatches,
} from "@jsonforms/core"
import { JsonFormsDispatch } from "@jsonforms/react"
import { Switch } from "@opengovsg/design-system-react"

import type { WidgetType } from "../../contexts/WidgetContext"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { withJsonFormsControlWithDetailProps } from "../../contexts/JsonFormsContext"
import { useWidget, WIDGET_CONFIG } from "../../contexts/WidgetContext"

export const jsonFormsWidgetIntegrationControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.WidgetControl,
  schemaMatches((schema) => !!schema.format?.startsWith("widget-integration/")),
)

export function JsonFormsWidgetIntegrationControl({
  data,
  path,
  schema,
  handleChange,
  rootSchema,
  uischema,
  uischemas,
  cells,
  renderers,
  enabled,
}: ControlWithDetailProps) {
  const { activeWidget, setActiveWidget, getNextWidget } = useWidget()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [snapshot, setSnapshot] = useState(data)
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

  useEffect(() => {
    // NOTE: sync data with snapshot
    // if data exists
    if (data) setSnapshot(data)
  }, [data])

  const variant = extractVariantFromFormat(schema.format)
  const isChecked = activeWidget === variant

  useEffect(() => {
    if (isChecked && !data) {
      handleChange(path, snapshot)
    }

    if (!isChecked) {
      handleChange(path, undefined)
    }
  }, [isChecked, data, handleChange, path, snapshot])

  const handleToggle = () => {
    const next = isChecked ? null : getNextWidget(variant)
    setActiveWidget(next)
  }

  const { icon, label: widgetLabel } = WIDGET_CONFIG[variant]

  return (
    <>
      <VStack gap="0.5rem" alignItems="flex-start">
        <Box>{icon}</Box>
        <Flex w="full">
          <Box>
            <Text textStyle="subhead-2">{`Enable your ${widgetLabel} widget on this website`}</Text>
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

export default withJsonFormsControlWithDetailProps(
  JsonFormsWidgetIntegrationControl,
)

function extractVariantFromFormat(format?: string): WidgetType {
  const possibleFormat = format?.split("/")[1]
  if (!possibleFormat) return "askgov"

  switch (possibleFormat) {
    case "askgov":
    case "vica":
      return possibleFormat

    default:
      // NOTE: cannot do exhaustive check as the string split
      // will return a string type
      return "askgov"
  }
}
