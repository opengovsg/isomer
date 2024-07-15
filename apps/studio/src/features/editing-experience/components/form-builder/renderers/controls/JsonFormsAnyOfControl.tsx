import type { CombinatorRendererProps, RankedTester } from "@jsonforms/core"
import { useState } from "react"
import { Box, FormControl } from "@chakra-ui/react"
import {
  createCombinatorRenderInfos,
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
}: CombinatorRendererProps) {
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

  const [variant, setVariant] = useState("")

  const onChange = (value: string) => {
    setVariant(value)
    handleChange(path, value)
  }

  return (
    <>
      <Box py={2}>
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
