import type { ControlWithDetailProps, RankedTester } from "@jsonforms/core"
import { useMemo } from "react"
import {
  findUISchema,
  Generate,
  isObjectControl,
  rankWith,
} from "@jsonforms/core"
import { JsonFormsDispatch, withJsonFormsControlProps } from "@jsonforms/react"
import isEmpty from "lodash/isEmpty"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

export const jsonFormsObjectControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ObjectControl,
  isObjectControl,
)

export function JsonFormsObjectControl({
  data,
  path,
  visible,
  renderers,
  cells,
  schema,
  enabled,
  uischema,
  uischemas,
  rootSchema,
  handleChange,
}: ControlWithDetailProps) {
  const detailUiSchema = useMemo(
    () =>
      findUISchema(
        uischemas ?? [],
        schema,
        uischema.scope,
        path,
        () =>
          Generate.uiSchema(schema, "VerticalLayout", undefined, rootSchema),
        uischema,
        rootSchema,
      ),
    [uischemas, schema, uischema, path, rootSchema],
  )

  if (isEmpty(data)) {
    handleChange(path, undefined)
  }

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

export default withJsonFormsControlProps(JsonFormsObjectControl)
