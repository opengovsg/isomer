import { Box, Heading } from '@chakra-ui/react'
import {
  createDefaultValue,
  isObjectArrayControl,
  rankWith,
  type ArrayLayoutProps,
  type RankedTester,
} from '@jsonforms/core'
import { withJsonFormsArrayLayoutProps } from '@jsonforms/react'
import { Button } from '@opengovsg/design-system-react'
import { JSON_FORMS_RANKING } from '~/constants/formBuilder'

export const jsonFormsArrayControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ArrayControl,
  isObjectArrayControl,
)

export function JsonFormsArrayControl({
  path,
  label,
  addItem,
  schema,
  rootSchema,
}: ArrayLayoutProps) {
  return (
    <Box py={2}>
      <Heading as="h3" size="sm" variant="subhead-1">
        {label}
      </Heading>

      <p>Placeholder for drag-and-drop of objects</p>

      <Button
        onClick={addItem(path, createDefaultValue(schema, rootSchema))}
        mt={3}
        w="100%"
        variant="outline"
      >
        Add item
      </Button>
    </Box>
  )
}

export default withJsonFormsArrayLayoutProps(JsonFormsArrayControl)
