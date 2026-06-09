import { composePaths, type ArrayLayoutProps } from "@jsonforms/core"

import type { UseArrayReturn } from "../hooks/useArray"
import { ComplexEditorNestedDrawer } from "./ComplexEditorNestedDrawer"

type NestedDrawerProviderProps = ArrayLayoutProps &
  UseArrayReturn & {
    children: React.ReactNode
  }
export const NestedDrawerProvider = ({
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
  handleRemoveItem,
  data,
}: NestedDrawerProviderProps) => {
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
          handleRemoveItem={handleRemoveItem(path, selectedIndex)}
          selectedIndex={selectedIndex}
          maxIndex={data - 1}
        />
      ) : (
        children
      )}
    </>
  )
}
