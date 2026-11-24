import type { DropResult } from "@hello-pangea/dnd"
import type {
  ArrayLayoutProps,
  JsonSchema,
  JsonSchema7,
  UISchemaElement,
} from "@jsonforms/core"
import { findUISchema } from "@jsonforms/core"
import { useJsonForms } from "@jsonforms/react"
import { useCallback, useMemo, useState } from "react"
import { ajv } from "~/utils/ajv"

export type UseArrayArgs = Pick<
  ArrayLayoutProps,
  | "data"
  | "path"
  | "arraySchema"
  | "schema"
  | "rootSchema"
  | "uischemas"
  | "uischema"
  | "removeItems"
  | "moveUp"
  | "moveDown"
>

export interface UseArrayReturn {
  selectedIndex: number | undefined
  setSelectedIndex: (selectedIndex?: number) => void
  isAddItemDisabled: boolean
  isRemoveItemDisabled: boolean
  childUiSchema: UISchemaElement
  /**
   * Remove flow for the nested drawer: no-ops unless a row is selected, and
   * adjusts `selectedIndex` after removal. Row-level deletes outside the
   * drawer should call `removeItems` directly (see `useDeleteTarget`).
   */
  handleRemoveSelectedItem: (path: string, index: number) => () => void
  onDragEnd: (result: DropResult) => void
}

// A root-level if/then can tighten an array's maxItems based on sibling data,
// e.g. infocards caps cards at 6 when display is carousel.
// ponytail: only reads root if/then on top-level arrays, extend if nested conditionals appear
export const getConditionalMaxItems = (
  rootSchema: JsonSchema,
  rootData: unknown,
  path: string,
): number | undefined => {
  // if/then only exist on draft-07 schemas
  const { if: ifSchema, then: thenSchema } = rootSchema as JsonSchema7
  if (typeof ifSchema !== "object" || typeof thenSchema !== "object") {
    return undefined
  }
  const maxItems = thenSchema.properties?.[path]?.maxItems
  if (maxItems === undefined || !ajv.validate(ifSchema, rootData)) {
    return undefined
  }
  return maxItems
}

export function useArray({
  data,
  path,
  arraySchema,
  schema,
  rootSchema,
  uischemas,
  uischema,
  removeItems,
  moveUp,
  moveDown,
}: UseArrayArgs): UseArrayReturn {
  const [selectedIndex, setSelectedIndex] = useState<number>()
  const { core } = useJsonForms()
  const maxItems =
    getConditionalMaxItems(rootSchema, core?.data, path) ?? arraySchema.maxItems

  const isRemoveItemDisabled =
    arraySchema.minItems !== undefined && data <= arraySchema.minItems
  const isAddItemDisabled = maxItems !== undefined && data >= maxItems

  const handleRemoveSelectedItem = useCallback(
    (path: string, index: number) => () => {
      if (selectedIndex === undefined || !removeItems || isRemoveItemDisabled) {
        return
      }

      removeItems(path, [index])()

      if (selectedIndex === index) {
        setSelectedIndex(undefined)
      } else if (selectedIndex > index) {
        setSelectedIndex(selectedIndex - 1)
      }
    },
    [isRemoveItemDisabled, removeItems, selectedIndex],
  )

  const handleMoveItem = useCallback(
    (path: string, originalIndex: number, newIndex: number) => {
      if (originalIndex === newIndex || !moveDown || !moveUp) {
        return
      }

      if (originalIndex < newIndex) {
        for (let i = originalIndex; i < newIndex; i++) {
          moveDown(path, i)()
        }
      } else {
        for (let i = originalIndex; i > newIndex; i--) {
          moveUp(path, i)()
        }
      }
    },
    [moveUp, moveDown],
  )

  const childUiSchema = useMemo(
    () =>
      findUISchema(
        uischemas ?? [],
        schema,
        uischema.scope,
        path,
        undefined,
        uischema,
        rootSchema,
      ),
    [uischemas, schema, uischema, path, rootSchema],
  )

  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) {
        return
      }
      handleMoveItem(path, result.source.index, result.destination.index)
    },
    [path, handleMoveItem],
  )

  return {
    selectedIndex,
    setSelectedIndex,
    isAddItemDisabled,
    isRemoveItemDisabled,
    childUiSchema,
    handleRemoveSelectedItem,
    onDragEnd,
  }
}
