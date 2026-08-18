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

// When switching between combinator branches (e.g. an InfoCards "variant"),
// keep any existing field/array-item values that are still valid under the
// newly selected schema instead of resetting them to schema defaults, so
// content the editor already entered isn't wiped out by the switch.
export function mergeDataWithSchema(
  oldData: unknown,
  newSchema: JsonSchema,
  rootSchema: JsonSchema,
): unknown {
  if (newSchema.type !== "object" || !newSchema.properties) {
    // oxlint-disable-next-line @typescript-eslint/no-unsafe-return
    return createDefaultValue(newSchema, rootSchema) as unknown
  }

  const oldObject =
    typeof oldData === "object" && oldData !== null && !Array.isArray(oldData)
      ? (oldData as Record<string, unknown>)
      : {}

  const merged: Record<string, unknown> = {}
  for (const [key, propSchema] of Object.entries(newSchema.properties)) {
    const value = mergeFieldWithSchema(
      oldObject[key],
      propSchema as JsonSchema,
      rootSchema,
    )
    // Omit rather than write `undefined`, so a field that was never filled
    // in stays absent instead of being materialized as an empty value.
    if (value !== undefined) {
      merged[key] = value
    }
  }
  return merged
}

function mergeFieldWithSchema(
  oldValue: unknown,
  propSchema: JsonSchema,
  rootSchema: JsonSchema,
): unknown {
  // Discriminator/literal fields (e.g. `variant`) must always take on the
  // newly selected schema's value, never the previous branch's value.
  if (propSchema.const !== undefined) {
    return propSchema.const
  }

  if (oldValue !== undefined) {
    if (propSchema.type === "array" && Array.isArray(oldValue)) {
      const itemSchema = Array.isArray(propSchema.items)
        ? propSchema.items[0]
        : propSchema.items
      if (!itemSchema) {
        return oldValue
      }
      return oldValue.map((item) =>
        mergeDataWithSchema(item, itemSchema, rootSchema),
      )
    }

    if (propSchema.type === "object") {
      return mergeDataWithSchema(oldValue, propSchema, rootSchema)
    }

    return oldValue
  }

  // No previous value for this field: fall back to the schema's own default
  // (if any) rather than inventing one, so a field the editor never touched
  // stays absent - same as it would be on a freshly added card.
  return propSchema.default
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
      const mergedData = mergeDataWithSchema(data, newSchema, rootSchema) as
        | Record<string, unknown>
        | undefined
      handleChange(path, {
        ...data,
        ...mergedData,
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
