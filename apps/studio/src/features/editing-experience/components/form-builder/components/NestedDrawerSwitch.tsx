import type { ArrayLayoutProps } from "@jsonforms/core"
import type { ReactNode } from "react"
import { composePaths } from "@jsonforms/core"

import type { UseArrayReturn } from "../hooks/useArray"
import { ComplexEditorNestedDrawer } from "./ComplexEditorNestedDrawer"

type NestedDrawerSwitchProps = ArrayLayoutProps &
  UseArrayReturn & {
    children: ReactNode
  }
/**
 * Renders the nested item drawer when a row is selected, the list otherwise.
 */
// oxlint-disable-next-line typescript/promise-function-async -- core cleanup deferred
export const NestedDrawerSwitch = ({
  children,
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
}: NestedDrawerSwitchProps) => {
  if (selectedIndex === undefined) {
    return children
  }

  return (
    <ComplexEditorNestedDrawer
      renderers={renderers}
      cells={cells}
      visible={visible}
      schema={schema}
      uischema={childUiSchema}
      path={composePaths(path, `${selectedIndex}`)}
      label={label}
      setSelectedIndex={setSelectedIndex}
      isRemoveItemDisabled={isRemoveItemDisabled}
      handleRemoveItem={handleRemoveSelectedItem(path, selectedIndex)}
      selectedIndex={selectedIndex}
      maxIndex={data - 1}
    />
  )
}
