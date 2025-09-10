import type { CombinatorRendererProps, RankedTester } from "@jsonforms/core"
import { useEffect, useState } from "react"
import { Box, FormControl, RadioGroup } from "@chakra-ui/react"
import {
  createCombinatorRenderInfos,
  createDefaultValue,
  rankWith,
} from "@jsonforms/core"
import { JsonFormsDispatch, withJsonFormsAnyOfProps } from "@jsonforms/react"
import { FormLabel, Radio } from "@opengovsg/design-system-react"
import {
  DATA_SOURCE_FORMAT,
  DATA_SOURCE_TYPE,
} from "@opengovsg/isomer-components"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

export const jsonFormsDataSourceControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.DataSourceControl,
  (uischema, schema) => {
    // Check if this is a dataSource Union by looking for the DATA_SOURCE_FORMAT
    return schema.format === DATA_SOURCE_FORMAT
  },
)

export function JsonFormsDataSourceControl({
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

  const options = anyOfRenderInfos
    .map((anyOfRenderInfo) => {
      if (anyOfRenderInfo.schema.format === "hidden") {
        return null
      }

      const option = String(
        anyOfRenderInfo.label || anyOfRenderInfo.schema.const,
      )

      return {
        label: option.charAt(0).toUpperCase() + option.slice(1),
        value: option,
      }
    })
    .filter((option) => option !== null)

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

  // Helper function to get data source type from data
  const getDataSourceType = (data: unknown): string | null => {
    if (data && typeof data === "object" && "dataSource" in data) {
      const dataObj = data as Record<string, unknown>
      const dataSource = dataObj.dataSource
      if (
        dataSource &&
        typeof dataSource === "object" &&
        "type" in dataSource
      ) {
        const dataSourceObj = dataSource as Record<string, unknown>
        const typeValue = dataSourceObj.type
        if (typeof typeValue === "string") {
          return typeValue
        }
      }
    }
    return null
  }

  // Helper function to find matching option by data source type
  const findMatchingOption = (dataSourceType: string) => {
    return options.find((option) => {
      // Check if the option value matches any of the DATA_SOURCE_TYPE values
      return Object.values(DATA_SOURCE_TYPE).some((validType) => {
        const validTypeStr = String(validType)
        return (
          option.value.toLowerCase().includes(validTypeStr.toLowerCase()) &&
          dataSourceType.toLowerCase() === validTypeStr.toLowerCase()
        )
      })
    })
  }

  useEffect(() => {
    // If indexOfFittingSchema is valid, use it
    if (indexOfFittingSchema >= 0 && options[indexOfFittingSchema]) {
      setVariant(options[indexOfFittingSchema].label)
      return
    }
    // If there are no options, return
    if (options.length === 0) {
      return
    }
    // For dataSource format, try to determine the correct variant from the data
    const dataSourceType = getDataSourceType(data)
    if (dataSourceType) {
      const matchingOption = findMatchingOption(dataSourceType)
      if (matchingOption) {
        setVariant(matchingOption.label)
        return
      }
    }
    // Default to first available option
    setVariant(options[0]?.label || "")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle data changes after initial mount
  useEffect(() => {
    // If there are no options, return
    if (options.length === 0) {
      return
    }
    const dataSourceType = getDataSourceType(data)
    if (dataSourceType) {
      const matchingOption = findMatchingOption(dataSourceType)
      if (matchingOption && variant !== matchingOption.label) {
        setVariant(matchingOption.label)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, options, variant])

  return (
    <>
      <Box>
        <FormControl isRequired gap="0.5rem">
          <FormLabel description={description}>
            {label || "Data source"}
          </FormLabel>
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

export default withJsonFormsAnyOfProps(JsonFormsDataSourceControl)
