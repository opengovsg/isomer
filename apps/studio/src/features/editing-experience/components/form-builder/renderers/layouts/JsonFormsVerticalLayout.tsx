import { Box, VStack } from '@chakra-ui/react'
import {
  type VerticalLayout,
  rankWith,
  uiTypeIs,
  type LayoutProps,
  type RankedTester,
} from '@jsonforms/core'
import { JsonFormsDispatch, withJsonFormsLayoutProps } from '@jsonforms/react'
import { JSON_FORMS_RANKING } from '~/constants/formBuilder'

export const jsonFormsVerticalLayoutTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.VerticalLayoutRenderer,
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
      {elements.map((element, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <Box key={`${path}-${index}`} w="100%">
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
