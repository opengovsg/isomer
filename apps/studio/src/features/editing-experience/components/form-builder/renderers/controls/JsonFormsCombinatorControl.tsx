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
// keep field values and array items that are still valid under the newly
// selected schema instead of resetting everything to schema defaults, so
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
  for (const [key, propSchema] of Object.entries(newSchema.properties) as [
    string,
    JsonSchema,
  ][]) {
    // Discriminator/literal fields (e.g. `variant`) always take on the
    // newly selected schema's value, never the previous branch's value.
    if (propSchema.const !== undefined) {
      merged[key] = propSchema.const
      continue
    }

    const oldValue = oldObject[key]
    const itemSchema = Array.isArray(propSchema.items)
      ? propSchema.items[0]
      : propSchema.items

    if (propSchema.type === "array" && Array.isArray(oldValue) && itemSchema) {
      merged[key] = oldValue.map((item) => pickFields(item, itemSchema))
    } else if (oldValue !== undefined) {
      merged[key] = oldValue
    } else if (propSchema.default !== undefined) {
      // No previous value for this field: fall back to the schema's own
      // default (if any), same as a freshly added card would get, rather
      // than inventing one.
      merged[key] = propSchema.default
    }
  }
  return merged
}

// Keeps only the keys `itemSchema` still declares, dropping fields specific
// to the previous variant (e.g. image fields when switching to no-image).
function pickFields(item: unknown, itemSchema: JsonSchema): unknown {
  if (
    itemSchema.type !== "object" ||
    !itemSchema.properties ||
    typeof item !== "object" ||
    item === null
  ) {
    return item
  }

  const oldItem = item as Record<string, unknown>
  const picked: Record<string, unknown> = {}
  for (const key of Object.keys(itemSchema.properties)) {
    if (oldItem[key] !== undefined) {
      picked[key] = oldItem[key]
    }
  }
  return picked
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
