import { composePaths, type ArrayLayoutProps } from "@jsonforms/core"

import type { UseArrayReturn } from "../hooks/useArray"
import { ComplexEditorNestedDrawer } from "./ComplexEditorNestedDrawer"

type NestedDrawerSwitchProps = ArrayLayoutProps &
  UseArrayReturn & {
    children: React.ReactNode
  }
/**
 * Renders the nested item drawer when a row is selected, the list otherwise.
 */
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
  return (
    <>
      {selectedIndex !== undefined ? (
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
      ) : (
        children
      )}
    </>
  )
}
