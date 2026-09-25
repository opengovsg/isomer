import type { CombinatorRendererProps, JsonSchema, RankedTester } from "@jsonforms/core"
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
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

// TODO: Merge with JsonFormsChildPageLayoutControl — same titled layout + preview pattern.

/** DS Radio wraps label + preview; suppress full-card focus ring on click. */
const heroActionLayoutRadioCss = {
  _focusWithin: {
    boxShadow: "none",
    outline: "none",
  },
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
    const newData = createDefaultValue(renderInfo.schema, rootSchema)
    handleChange(path, {
      ...data,
      ...newData,
    })
  }

  useEffect(() => {
    const match = renderInfos[indexOfFittingSchema]
    if (match?.label) {
      setVariant(String(match.label))
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [indexOfFittingSchema])

  const selectedLayout =
    typeof data === "object" &&
    data !== null &&
    "actionLayout" in data &&
    typeof data.actionLayout === "string"
      ? data.actionLayout
      : HERO_ACTION_LAYOUT.buttons

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
