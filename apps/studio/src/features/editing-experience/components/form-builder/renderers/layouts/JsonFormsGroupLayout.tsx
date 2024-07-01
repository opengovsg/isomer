import { Box, Divider, Heading, VStack } from '@chakra-ui/react'
import {
  or,
  rankWith,
  schemaMatches,
  uiTypeIs,
  type GroupLayout,
  type LayoutProps,
  type RankedTester,
} from '@jsonforms/core'
import { JsonFormsDispatch, withJsonFormsLayoutProps } from '@jsonforms/react'
import React from 'react'
import { JSON_FORMS_RANKING } from '~/constants/formBuilder'

export const jsonFormsGroupLayoutTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.GroupLayoutRenderer,
  or(
    uiTypeIs('Group'),
    schemaMatches((schema) =>
      Object.prototype.hasOwnProperty.call(schema, 'group'),
    ),
  ),
)

const GroupComponent = React.memo(function GroupComponent({
  visible,
  enabled,
  uischema,
  label,
  schema,
  path,
  renderers,
  cells,
}: LayoutProps) {
  const { elements } = uischema as GroupLayout

  if (!visible) {
    return null
  }

  return (
    <VStack spacing={4}>
      <Divider borderColor="base.divider.strong" />
      <Box w="100%">
        <Heading as="h3" size="sm">
          {label}
        </Heading>
      </Box>
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
})

export function JsonFormsGroupLayoutRenderer({
  uischema,
  schema,
  path,
  visible,
  enabled,
  renderers,
  cells,
  direction,
  label,
}: LayoutProps) {
  return (
    <GroupComponent
      schema={schema}
      path={path}
      direction={direction}
      visible={visible}
      enabled={enabled}
      uischema={uischema}
      renderers={renderers}
      cells={cells}
      label={label}
    />
  )
}

export default withJsonFormsLayoutProps(JsonFormsGroupLayoutRenderer)
