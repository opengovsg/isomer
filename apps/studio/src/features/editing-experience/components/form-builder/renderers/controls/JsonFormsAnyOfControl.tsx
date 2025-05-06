import type { CombinatorRendererProps, RankedTester } from "@jsonforms/core"
import { useEffect, useState } from "react"
import { Box, FormControl, RadioGroup } from "@chakra-ui/react"
import {
  createCombinatorRenderInfos,
  createDefaultValue,
  isAnyOfControl,
  rankWith,
} from "@jsonforms/core"
import { JsonFormsDispatch, withJsonFormsAnyOfProps } from "@jsonforms/react"
import { FormLabel, Radio, SingleSelect } from "@opengovsg/design-system-react"
import { ARRAY_RADIO_FORMAT } from "@opengovsg/isomer-components"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { withLayoutFilter } from "../withLayoutFilter"

export const jsonFormsAnyOfControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.AnyOfControl,
  isAnyOfControl,
)

export function JsonFormsAnyOfControl({
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
}: CombinatorRendererProps) {
  const [variant, setVariant] = useState("")
  const anyOfRenderInfos = createCombinatorRenderInfos(
    schema.anyOf ?? [],
    rootSchema,
    "anyOf",
    uischema,
    path,
    uischemas,
  )

  const options = anyOfRenderInfos.map((anyOfRenderInfo) => {
    const option = String(anyOfRenderInfo.label || anyOfRenderInfo.schema.const)

    return {
      label: option.charAt(0).toUpperCase() + option.slice(1),
      value: option,
    }
  })

  const onChange = (value: string) => {
    setVariant(value)

    const newSchema =
      anyOfRenderInfos[options.findIndex((option) => option.value === value)]
        ?.schema
    if (!newSchema) {
      handleChange(path, {})
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

  useEffect(() => {
    setVariant(options[indexOfFittingSchema]?.label || "")
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      {anyOfRenderInfos.map(
        (anyOfRenderInfo) =>
          variant === anyOfRenderInfo.label && (
            <JsonFormsDispatch
              key={anyOfRenderInfo.label}
              uischema={anyOfRenderInfo.uischema}
              schema={anyOfRenderInfo.schema}
              path={path}
              renderers={renderers}
              cells={cells}
            />
          ),
      )}
    </>
  )
}

export default withJsonFormsAnyOfProps(withLayoutFilter(JsonFormsAnyOfControl))
