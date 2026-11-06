import type {
  ArrayLayoutProps,
  RankedTester,
  UISchemaElement,
} from "@jsonforms/core"
import {
  createDefaultValue,
  isObjectArrayControl,
  isPrimitiveArrayControl,
  or,
  rankWith,
} from "@jsonforms/core"
import { withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

import { DraggableArrayList } from "../../components/DraggableArrayList"
import { DraggableTagButton } from "../../components/DraggableTagButton"
import { NestedDrawerSwitch } from "../../components/NestedDrawerSwitch"
import { useArray } from "../../hooks/useArray"

export const jsonFormsArrayControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ArrayControl,
  or(isObjectArrayControl, isPrimitiveArrayControl),
)

export function JsonFormsArrayControl({
  createItem,
  childLabelProp,
  mapDrawerUiSchema,
  ...props
}: ArrayLayoutProps & {
  createItem?: () => unknown
  childLabelProp?: string
  mapDrawerUiSchema?: (uischema: UISchemaElement) => UISchemaElement
}) {
  const {
    data,
    path,
    enabled,
    label,
    addItem,
    arraySchema,
    schema,
    rootSchema,
    uischemas,
    uischema,
    removeItems,
    moveUp,
    moveDown,
    description,
  } = props
  const arrayResult = useArray({
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
  })
  const {
    setSelectedIndex,
    isAddItemDisabled,
    childUiSchema,
    handleRemoveSelectedItem,
    onDragEnd,
  } = arrayResult

  return (
    <NestedDrawerSwitch
      {...props}
      {...arrayResult}
      childUiSchema={
        mapDrawerUiSchema ? mapDrawerUiSchema(childUiSchema) : childUiSchema
      }
    >
      <DraggableArrayList
        label={label}
        description={description}
        path={path}
        count={data}
        isAddDisabled={isAddItemDisabled}
        onAdd={() => {
          addItem(
            path,
            createItem ? createItem() : createDefaultValue(schema, rootSchema),
          )()
          setSelectedIndex(data)
        }}
        onDragEnd={onDragEnd}
        renderRow={(index, { hasError, dragHandleProps }) => (
          <>
            <DraggableTagButton.Handle
              dragHandleProps={dragHandleProps}
              py={hasError ? "0.75rem" : "1.25rem"}
            />
            <DraggableTagButton.Body
              onClick={() => setSelectedIndex(index)}
              py={hasError ? "0.75rem" : "1rem"}
            >
              <DraggableTagButton.Content>
                <DraggableTagButton.Label
                  {...(childLabelProp ? { childLabelProp } : {})}
                  index={index}
                  path={path}
                  schema={schema}
                  uischema={childUiSchema}
                  enabled={enabled}
                  removeItem={handleRemoveSelectedItem}
                />
                {hasError && <DraggableTagButton.ErrorCaption />}
              </DraggableTagButton.Content>
            </DraggableTagButton.Body>
          </>
        )}
      />
    </NestedDrawerSwitch>
  )
}

export default withJsonFormsArrayLayoutProps(JsonFormsArrayControl)
