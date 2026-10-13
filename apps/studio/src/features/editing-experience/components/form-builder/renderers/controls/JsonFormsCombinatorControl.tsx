import type { CombinatorRendererProps, RankedTester } from "@jsonforms/core"
import type { ReactNode } from "react"
import { Box, FormControl, RadioGroup } from "@chakra-ui/react"
import {
  createCombinatorRenderInfos,
  createDefaultValue,
  isAnyOfControl,
  isOneOfControl,
  rankWith,
} from "@jsonforms/core"
import {
  JsonFormsDispatch,
  withJsonFormsAnyOfProps,
  withJsonFormsOneOfProps,
} from "@jsonforms/react"
import { FormLabel, Radio, SingleSelect } from "@opengovsg/design-system-react"
import {
  ARRAY_RADIO_FORMAT,
  HERO_BANNER_STYLE_FORMAT,
  TAG_CATEGORY_ITEM_FORMAT,
} from "@opengovsg/isomer-components"
import { useState } from "react"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

import { HeroBannerStyleCombinator } from "./HeroBannerStyleControl"

export const jsonFormsOneOfControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.OneOfControl,
  isOneOfControl,
)

export const jsonFormsAnyOfControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.AnyOfControl,
  isAnyOfControl,
)

interface JsonFormsCombinatorControlProps extends CombinatorRendererProps {
  combinatorType: "oneOf" | "anyOf"
}

type CombinatorRenderInfo = ReturnType<
  typeof createCombinatorRenderInfos
>[number]

function combinatorOptionFromRenderInfo(renderInfo: CombinatorRenderInfo) {
  const option = String(renderInfo.label || renderInfo.schema.const)

  return {
    label: option.charAt(0).toUpperCase() + option.slice(1),
    value: option,
  }
}

interface CombinatorFormatContext {
  label: string | undefined
  description: string | undefined
  renderInfos: CombinatorRenderInfo[]
  variant: string
  onChange: (value: string) => void
  activeRenderInfo: CombinatorRenderInfo | undefined
  path: string
  renderers: JsonFormsCombinatorControlProps["renderers"]
  cells: JsonFormsCombinatorControlProps["cells"]
}

function CombinatorActiveBranch({
  activeRenderInfo,
  path,
  renderers,
  cells,
}: Pick<
  CombinatorFormatContext,
  "activeRenderInfo" | "path" | "renderers" | "cells"
>) {
  if (!activeRenderInfo) {
    return null
  }

  return (
    <JsonFormsDispatch
      key={activeRenderInfo.label}
      uischema={activeRenderInfo.uischema}
      schema={activeRenderInfo.schema}
      path={path}
      renderers={renderers}
      cells={cells}
    />
  )
}

// Format-specific combinators replace the default variant picker.
// Unlisted formats fall through to radio or select.
const combinatorFormatHandlers: Partial<
  Record<string, (context: CombinatorFormatContext) => ReactNode>
> = {
  [HERO_BANNER_STYLE_FORMAT]: (context) => (
    <HeroBannerStyleCombinator {...context} />
  ),
  [TAG_CATEGORY_ITEM_FORMAT]: (context) => (
    <CombinatorActiveBranch
      activeRenderInfo={context.activeRenderInfo}
      path={context.path}
      renderers={context.renderers}
      cells={context.cells}
    />
  ),
}

function JsonFormsCombinatorControl({
  schema,
  path,
  renderers,
  cells,
  rootSchema,
  uischema,
  uischemas,
  label,
  description,
  handleChange,
  indexOfFittingSchema,
  data,
  combinatorType,
}: JsonFormsCombinatorControlProps) {
  const combinatorSchemas = schema[combinatorType] ?? []
  const renderInfos = createCombinatorRenderInfos(
    combinatorSchemas,
    rootSchema,
    combinatorType,
    uischema,
    path,
    uischemas,
  )

  const options = renderInfos
    .map((renderInfo) => {
      if (renderInfo.schema.format === "hidden") {
        return null
      }

      return combinatorOptionFromRenderInfo(renderInfo)
    })
    .filter((option) => option !== null)

  // Snapshot the fitting branch once. Re-reading indexOfFittingSchema on every
  // change would jump to the first branch whenever a required field is cleared.
  const [variant, setVariant] = useState(() => {
    const fittingInfo =
      indexOfFittingSchema >= 0 ? renderInfos[indexOfFittingSchema] : undefined

    if (fittingInfo) {
      return combinatorOptionFromRenderInfo(fittingInfo).label
    }

    return options[0]?.label ?? ""
  })

  const onChange = (value: string) => {
    setVariant(value)

    const newSchema = renderInfos.find((renderInfo) => {
      const option = String(renderInfo.label || renderInfo.schema.const)
      return option === value
    })?.schema
    if (!newSchema) {
      handleChange(path, {})
    } else {
      // oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const newData = createDefaultValue(newSchema, rootSchema)

      if (newSchema.type === "string") {
        handleChange(path, newSchema.const || "")
      } else {
        handleChange(path, {
          ...data,
          ...newData,
        })
      }
    }
  }

  const activeRenderInfo = renderInfos.find(
    (renderInfo) => variant === renderInfo.label,
  )

  const formatContext: CombinatorFormatContext = {
    label,
    description,
    renderInfos,
    variant,
    onChange,
    activeRenderInfo,
    path,
    renderers,
    cells,
  }
  const formatHandler = schema.format
    ? combinatorFormatHandlers[schema.format]
    : undefined

  if (formatHandler) {
    return formatHandler(formatContext)
  }

  return (
    <>
      <Box>
        <FormControl isRequired gap="0.5rem">
          <FormLabel description={description}>{label || "Variant"}</FormLabel>
          {schema.format === ARRAY_RADIO_FORMAT ? (
            <RadioGroup
              onChange={onChange}
              value={options.find((option) => option.label === variant)?.value}
            >
              {options.map((option) => (
                <Radio
                  my="1px"
                  key={option.label}
                  value={option.value}
                  allowDeselect={false}
                >
                  {option.label.charAt(0).toUpperCase() + option.label.slice(1)}
                </Radio>
              ))}
            </RadioGroup>
          ) : (
            <SingleSelect
              value={variant}
              name={label}
              items={options}
              isClearable={false}
              onChange={onChange}
            />
          )}
        </FormControl>
      </Box>
      <CombinatorActiveBranch
        activeRenderInfo={activeRenderInfo}
        path={path}
        renderers={renderers}
        cells={cells}
      />
    </>
  )
}

function OneOfControl(props: CombinatorRendererProps) {
  return <JsonFormsCombinatorControl {...props} combinatorType="oneOf" />
}

function AnyOfControl(props: CombinatorRendererProps) {
  return <JsonFormsCombinatorControl {...props} combinatorType="anyOf" />
}

export const JsonFormsOneOfControl = withJsonFormsOneOfProps(OneOfControl)
export const JsonFormsAnyOfControl = withJsonFormsAnyOfProps(AnyOfControl)
