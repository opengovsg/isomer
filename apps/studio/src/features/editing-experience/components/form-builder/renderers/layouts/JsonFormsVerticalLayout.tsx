import { Box, VStack } from '@chakra-ui/react'
import {
  type VerticalLayout,
  rankWith,
  uiTypeIs,
  type LayoutProps,
  type RankedTester,
} from '@jsonforms/core'
import { JsonFormsDispatch, withJsonFormsLayoutProps } from '@jsonforms/react'

export const jsonFormsVerticalLayoutTester: RankedTester = rankWith(
  1,
  uiTypeIs('VerticalLayout'),
)

export function JsonFormsVerticalLayoutRenderer({
  uischema,
  schema,
  path,
  enabled,
  renderers,
  cells,
}: LayoutProps) {
  const { elements } = uischema as VerticalLayout

  return (
    <VStack spacing={2}>
      {elements.map((element) => (
        <Box key={path} w="100%">
          <JsonFormsDispatch
            uischema={element}
            schema={schema}
            path={path}
            enabled={enabled}
            renderers={renderers}
            cells={cells}
          />
        </Box>
      ))}
    </VStack>
  )
}

export default withJsonFormsLayoutProps(JsonFormsVerticalLayoutRenderer)
