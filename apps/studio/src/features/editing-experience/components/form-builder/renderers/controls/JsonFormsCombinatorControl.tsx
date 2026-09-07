/* oxlint-disable typescript/strict-boolean-expressions -- core cleanup deferred */
import type { CombinatorRendererProps, RankedTester } from "@jsonforms/core"
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
import { useState } from "react"
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

const JsonFormsCombinatorControl = ({
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
}: JsonFormsCombinatorControlProps) => {
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

  const [variant, setVariant] = useState(() => {
    if (options.length === 0) {
      return ""
    }

    if (indexOfFittingSchema >= 0 && options[indexOfFittingSchema]) {
      return options[indexOfFittingSchema].label
    }

    return options[0]?.label ?? ""
  })

  const onChange = (value: string) => {
    setVariant(value)

    const newSchema =
      renderInfos[options.findIndex((option) => option.value === value)]?.schema
    if (newSchema) {
      const newData = createDefaultValue(newSchema, rootSchema)

      if (newSchema.type === "string") {
        handleChange(path, newSchema.const || "")
      } else {
        handleChange(path, {
          ...data,
          ...newData,
        })
      }
    } else {
      handleChange(path, {})
    }
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

const OneOfControl = (props: CombinatorRendererProps) => (
  <JsonFormsCombinatorControl {...props} combinatorType="oneOf" />
)

const AnyOfControl = (props: CombinatorRendererProps) => (
  <JsonFormsCombinatorControl {...props} combinatorType="anyOf" />
)

export const JsonFormsOneOfControl = withJsonFormsOneOfProps(OneOfControl)
export const JsonFormsAnyOfControl = withJsonFormsAnyOfProps(AnyOfControl)
