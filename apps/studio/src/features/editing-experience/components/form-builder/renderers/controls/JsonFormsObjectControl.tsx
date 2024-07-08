import {
  Generate,
  findUISchema,
  isObjectControl,
  rankWith,
  type RankedTester,
  type StatePropsOfControlWithDetail,
} from '@jsonforms/core'
import { JsonFormsDispatch, withJsonFormsDetailProps } from '@jsonforms/react'
import { useMemo } from 'react'
import { JSON_FORMS_RANKING } from '~/constants/formBuilder'

export const jsonFormsObjectControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ObjectControl,
  isObjectControl,
)

export function JsonFormsObjectControl({
  path,
  visible,
  renderers,
  cells,
  schema,
  enabled,
  uischema,
  uischemas,
  rootSchema,
}: StatePropsOfControlWithDetail) {
  const detailUiSchema = useMemo(
    () =>
      findUISchema(
        uischemas || [],
        schema,
        uischema.scope,
        path,
        () =>
          Generate.uiSchema(schema, 'VerticalLayout', undefined, rootSchema),
        uischema,
        rootSchema,
      ),
    [uischemas, schema, uischema, path, rootSchema],
  )

  if (!visible) {
    return null
  }

  return (
    <JsonFormsDispatch
      visible={visible}
      enabled={enabled}
      schema={schema}
      uischema={detailUiSchema}
      path={path}
      renderers={renderers}
      cells={cells}
    />
  )
}

export default withJsonFormsDetailProps(JsonFormsObjectControl)
