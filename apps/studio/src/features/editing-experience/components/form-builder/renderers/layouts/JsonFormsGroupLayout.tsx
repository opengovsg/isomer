import type { LayoutProps, RankedTester } from "@jsonforms/core"
import React from "react"
import { Box, Divider, Heading, VStack } from "@chakra-ui/react"
import { rankWith, uiTypeIs } from "@jsonforms/core"
import { JsonFormsDispatch, withJsonFormsLayoutProps } from "@jsonforms/react"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { isGroupLayout } from "~/types/schema"

export const jsonFormsGroupLayoutTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.GroupLayoutRenderer,
  uiTypeIs("Group"),
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
  // Note: We have to perform this check here due to inaccuracies in JSONForms'
  // type definitions.
  // Ref: https://github.com/eclipsesource/jsonforms/blob/c3cead71d08ff11837bdeb5fbea66e5313137218/packages/material-renderers/src/layouts/MaterialGroupLayout.tsx#L52
  const elements = isGroupLayout(uischema) ? uischema.elements : []

  if (!visible) {
    return null
  }

  return (
    <Box mt="1.25rem" _first={{ mt: 0 }}>
      <Divider borderColor="base.divider.strong" />

      <Box w="100%" mt="1.25rem">
        <Heading textStyle="h3" as="h3" size="sm">
          {label}
        </Heading>
      </Box>

      {elements.map((element, index) => (
        <JsonFormsDispatch
          key={`${path}-${index}`}
          uischema={element}
          schema={schema}
          path={path}
          enabled={enabled}
          renderers={renderers}
          cells={cells}
        />
      ))}
    </Box>
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
