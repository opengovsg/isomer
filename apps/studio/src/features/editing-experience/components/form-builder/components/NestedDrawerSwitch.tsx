import type { ReactNode } from "react"
import {
  composePaths,
  type ArrayLayoutProps,
  type UISchemaElement,
} from "@jsonforms/core"

import type { UseArrayReturn } from "../hooks/useArray"
import { ComplexEditorNestedDrawer } from "./ComplexEditorNestedDrawer"

type NestedDrawerSwitchProps = ArrayLayoutProps &
  UseArrayReturn & {
    children: ReactNode
    banner?: ReactNode
    mapChildUiSchema?: (uischema: UISchemaElement) => UISchemaElement
  }
/**
 * Renders the nested item drawer when a row is selected, the list otherwise.
 */
export const NestedDrawerSwitch = ({
  children,
  banner,
  selectedIndex,
  cells,
  renderers,
  visible,
  schema,
  childUiSchema,
  path,
  label,
  setSelectedIndex,
  isRemoveItemDisabled,
  handleRemoveSelectedItem,
  data,
  mapChildUiSchema,
}: NestedDrawerSwitchProps) => {
  if (selectedIndex === undefined) {
    return children
  }

  const nestedUiSchema = mapChildUiSchema
    ? mapChildUiSchema(childUiSchema)
    : childUiSchema

  return (
    <ComplexEditorNestedDrawer
      renderers={renderers}
      cells={cells}
      visible={visible}
      schema={schema}
      uischema={nestedUiSchema}
      path={composePaths(path, `${selectedIndex}`)}
      label={label}
      setSelectedIndex={setSelectedIndex}
      isRemoveItemDisabled={isRemoveItemDisabled}
      handleRemoveItem={handleRemoveSelectedItem(path, selectedIndex)}
      selectedIndex={selectedIndex}
      maxIndex={data - 1}
      banner={banner}
    />
  )
}
