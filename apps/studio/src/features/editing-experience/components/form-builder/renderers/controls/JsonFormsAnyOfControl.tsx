import type { CombinatorRendererProps, RankedTester } from "@jsonforms/core"
import { useEffect, useState } from "react"
import { Box, FormControl } from "@chakra-ui/react"
import {
  createCombinatorRenderInfos,
  createDefaultValue,
  isAnyOfControl,
  rankWith,
} from "@jsonforms/core"
import { JsonFormsDispatch, withJsonFormsAnyOfProps } from "@jsonforms/react"
import { FormLabel, SingleSelect } from "@opengovsg/design-system-react"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

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
    const option = String(anyOfRenderInfo.schema.const || anyOfRenderInfo.label)

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
      const newData = createDefaultValue(newSchema, rootSchema)
      handleChange(path, {
        ...data,
        ...newData,
      })
    }
  }

  useEffect(() => {
    if (indexOfFittingSchema !== undefined) {
      setVariant(options[indexOfFittingSchema]?.label || "")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Box py="0.5rem">
        <FormControl isRequired>
          <FormLabel>{label || "Variant"}</FormLabel>
          <SingleSelect
            value={variant}
            name={label}
            items={options}
            isClearable={false}
            onChange={onChange}
          />
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

export default withJsonFormsAnyOfProps(JsonFormsAnyOfControl)
