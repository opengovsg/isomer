import { Box, FormControl } from '@chakra-ui/react'
import {
  createCombinatorRenderInfos,
  isAnyOfControl,
  rankWith,
  type CombinatorRendererProps,
  type RankedTester,
} from '@jsonforms/core'
import { JsonFormsDispatch, withJsonFormsAnyOfProps } from '@jsonforms/react'
import { FormLabel, SingleSelect } from '@opengovsg/design-system-react'
import { useState } from 'react'
import { JSON_FORMS_RANKING } from '~/constants/formBuilder'

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
}: CombinatorRendererProps) {
  const anyOfRenderInfos = createCombinatorRenderInfos(
    schema.anyOf || [],
    rootSchema,
    'anyOf',
    uischema,
    path,
    uischemas,
  )

  const variants = anyOfRenderInfos.map((anyOfRenderInfo) => ({
    label: anyOfRenderInfo.label,
    value: anyOfRenderInfo.label,
  }))

  const [variant, setVariant] = useState(anyOfRenderInfos[0]?.label || '')

  return (
    <Box py={2}>
      <FormControl isRequired>
        <FormLabel>Variant</FormLabel>
        <SingleSelect
          value={variant}
          name={label}
          items={variants}
          isClearable={false}
          onChange={setVariant}
        />
      </FormControl>

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
    </Box>
  )
}

export default withJsonFormsAnyOfProps(JsonFormsAnyOfControl)
