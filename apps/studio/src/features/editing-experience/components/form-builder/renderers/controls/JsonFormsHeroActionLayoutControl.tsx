import type {
  CombinatorRendererProps,
  JsonSchema,
  RankedTester,
} from "@jsonforms/core"
import { Box, Flex, FormControl } from "@chakra-ui/react"
import {
  createCombinatorRenderInfos,
  createDefaultValue,
  isOneOfControl,
  rankWith,
} from "@jsonforms/core"
import { JsonFormsDispatch, withJsonFormsOneOfProps } from "@jsonforms/react"
import { Badge, FormLabel, Radio } from "@opengovsg/design-system-react"
import {
  HERO_ACTION_LAYOUT,
  HERO_ACTION_LAYOUT_FORMAT,
} from "@opengovsg/isomer-components"
import { useEffect, useState } from "react"
import {
  IconHeroActionLayoutButtons,
  IconHeroActionLayoutQuickActions,
} from "~/components/icons"
import { HERO_QUICK_ACTIONS_DEFAULT_TITLE } from "~/components/PageEditor/constants"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

// TODO: Merge with JsonFormsChildPageLayoutControl — same titled layout + preview pattern.

/** DS Radio wraps label + preview; suppress full-card focus ring on click. */
const heroActionLayoutRadioCss = {
  _focusWithin: {
    boxShadow: "none",
    outline: "none",
  },
}

const readActionLayout = (value: unknown) => {
  if (
    typeof value !== "object" ||
    value === null ||
    !("actionLayout" in value)
  ) {
    return HERO_ACTION_LAYOUT.buttons
  }

  const layout = value.actionLayout
  return typeof layout === "string" ? layout : HERO_ACTION_LAYOUT.buttons
}

const actionLayoutConst = (schema: JsonSchema) => {
  const actionLayout = schema.properties?.actionLayout
  if (!actionLayout || typeof actionLayout !== "object") {
    return undefined
  }

  return "const" in actionLayout && typeof actionLayout.const === "string"
    ? actionLayout.const
    : undefined
}

const propertyKeys = (schema: JsonSchema) =>
  schema.properties ? Object.keys(schema.properties) : []

/** Keep shared hero fields and the selected layout. Drop the other layout's keys. */
export const nextHeroActionLayoutData = ({
  current,
  nextData,
  selectedSchema,
  otherSchemas,
  layout,
}: {
  current: unknown
  nextData: unknown
  selectedSchema: JsonSchema
  otherSchemas: JsonSchema[]
  layout: string
}) => {
  const selectedKeys = new Set(propertyKeys(selectedSchema))
  const keysToDrop = otherSchemas.flatMap((schema) =>
    propertyKeys(schema).filter((key) => !selectedKeys.has(key)),
  )
  const kept: Record<string, unknown> =
    typeof current === "object" && current !== null
      ? { ...(current as Record<string, unknown>) }
      : {}

  for (const key of keysToDrop) {
    delete kept[key]
  }

  return {
    ...kept,
    ...(typeof nextData === "object" && nextData !== null ? nextData : {}),
    ...(layout === HERO_ACTION_LAYOUT.quickActions
      ? { quickActionsTitle: HERO_QUICK_ACTIONS_DEFAULT_TITLE }
      : {}),
  }
}

export const jsonFormsHeroActionLayoutControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.HeroActionLayoutControl,
  (uischema, schema, context) =>
    schema.format === HERO_ACTION_LAYOUT_FORMAT &&
    isOneOfControl(uischema, schema, context),
)

function JsonFormsHeroActionLayoutControl({
  data,
  label,
  handleChange,
  path,
  description,
  schema,
  rootSchema,
  uischema,
  uischemas,
  renderers,
  cells,
  indexOfFittingSchema,
}: CombinatorRendererProps): JSX.Element {
  const [variant, setVariant] = useState("")
  const renderInfos = createCombinatorRenderInfos(
    schema.oneOf ?? [],
    rootSchema,
    "oneOf",
    uischema,
    path,
    uischemas,
  )

  const onChange = (layout: string) => {
    const renderInfo = renderInfos.find(
      (info) => actionLayoutConst(info.schema) === layout,
    )
    if (!renderInfo?.schema || !renderInfo.label) {
      return
    }

    setVariant(String(renderInfo.label))
    // oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const newData: unknown = createDefaultValue(renderInfo.schema, rootSchema)
    handleChange(
      path,
      nextHeroActionLayoutData({
        current: data,
        nextData: newData,
        selectedSchema: renderInfo.schema,
        otherSchemas: renderInfos
          .filter((info) => info !== renderInfo)
          .map((info) => info.schema),
        layout,
      }),
    )
  }

  useEffect(() => {
    const match = renderInfos[indexOfFittingSchema]
    if (match?.label) {
      setVariant(String(match.label))
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [indexOfFittingSchema])

  const selectedLayout = readActionLayout(data)

  return (
    <>
      <Box>
        <FormControl isRequired gap="0.5rem">
          <FormLabel description={description}>{label || "Layout"}</FormLabel>
          <Radio.RadioGroup
            display="flex"
            flexDir="row"
            gap={2}
            onChange={onChange}
            value={selectedLayout}
          >
            <Radio
              value={HERO_ACTION_LAYOUT.buttons}
              allowDeselect={false}
              size="sm"
              __css={heroActionLayoutRadioCss}
            >
              Buttons only
              <IconHeroActionLayoutButtons mt="10px" />
            </Radio>
            <Radio
              value={HERO_ACTION_LAYOUT.quickActions}
              allowDeselect={false}
              size="sm"
              __css={heroActionLayoutRadioCss}
            >
              <Flex alignItems="center" gap="8px">
                Quick actions
                <Badge variant="subtle" colorScheme="success" size="xs">
                  New
                </Badge>
              </Flex>
              <IconHeroActionLayoutQuickActions mt="10px" />
            </Radio>
          </Radio.RadioGroup>
        </FormControl>
      </Box>
      {renderInfos.map(
        (renderInfo) =>
          variant === renderInfo.label && (
            <JsonFormsDispatch
              key={renderInfo.label}
              uischema={renderInfo.uischema}
              schema={renderInfo.schema}
              path={path}
              renderers={renderers}
              cells={cells}
            />
          ),
      )}
    </>
  )
}

export default withJsonFormsOneOfProps(JsonFormsHeroActionLayoutControl)
