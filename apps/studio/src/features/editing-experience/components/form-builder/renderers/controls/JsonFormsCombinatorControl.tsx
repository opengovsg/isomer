import type {
  CombinatorRendererProps,
  JsonSchema,
  RankedTester,
} from "@jsonforms/core"
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
import { ARRAY_RADIO_FORMAT } from "@opengovsg/isomer-components"
import { useEffect, useState } from "react"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

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

// Switching a combinator branch (e.g. an InfoCards "variant") previously
// reset every array field (e.g. `cards`) to `[]`, wiping content the editor
// had already entered. Keep existing array items, dropping only the fields
// the new variant's item schema no longer has (e.g. image fields when
// switching to a no-image variant).
export function keepMatchingArrayFields(
  oldData: unknown,
  newSchema: JsonSchema,
): Record<string, unknown> {
  const oldObject =
    typeof oldData === "object" && oldData !== null && !Array.isArray(oldData)
      ? (oldData as Record<string, unknown>)
      : {}

  const preserved: Record<string, unknown> = {}
  for (const [key, propSchema] of Object.entries(
    newSchema.properties ?? {},
  ) as [string, JsonSchema][]) {
    const itemSchema = Array.isArray(propSchema.items)
      ? undefined
      : propSchema.items
    const oldItems = oldObject[key]
    if (!itemSchema?.properties || !Array.isArray(oldItems)) {
      continue
    }

    const allowedKeys = Object.keys(itemSchema.properties)
    preserved[key] = oldItems.map((item: unknown) =>
      typeof item === "object" && item !== null
        ? Object.fromEntries(
            Object.entries(item as Record<string, unknown>).filter(
              ([itemKey]) => allowedKeys.includes(itemKey),
            ),
          )
        : item,
    )
  }
  return preserved
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
  const [variant, setVariant] = useState("")
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

      const option = String(renderInfo.label || renderInfo.schema.const)

      return {
        label: option.charAt(0).toUpperCase() + option.slice(1),
        value: option,
      }
    })
    .filter((option) => option !== null)

  const onChange = (value: string) => {
    setVariant(value)

    const newSchema =
      renderInfos[options.findIndex((option) => option.value === value)]?.schema
    if (!newSchema) {
      handleChange(path, {})
    } else if (newSchema.type === "string") {
      handleChange(path, newSchema.const || "")
    } else {
      // oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const newData = createDefaultValue(newSchema, rootSchema)
      handleChange(path, {
        ...data,
        ...newData,
        ...keepMatchingArrayFields(data, newSchema),
      })
    }
  }

  useEffect(() => {
    // Do nothing if there are no options
    if (options.length === 0) {
      return
    }

    if (indexOfFittingSchema >= 0 && options[indexOfFittingSchema]) {
      setVariant(options[indexOfFittingSchema].label)
      return
    }

    // Fallback to first option
    if (options[0]) {
      setVariant(options[0].label)
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

function OneOfControl(props: CombinatorRendererProps) {
  return <JsonFormsCombinatorControl {...props} combinatorType="oneOf" />
}

function AnyOfControl(props: CombinatorRendererProps) {
  return <JsonFormsCombinatorControl {...props} combinatorType="anyOf" />
}

export const JsonFormsOneOfControl = withJsonFormsOneOfProps(OneOfControl)
export const JsonFormsAnyOfControl = withJsonFormsAnyOfProps(AnyOfControl)
