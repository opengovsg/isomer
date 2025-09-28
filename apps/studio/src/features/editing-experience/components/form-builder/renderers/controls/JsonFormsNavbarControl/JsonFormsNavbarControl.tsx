import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/dist/types/closest-edge"
import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import type { PartialDeep } from "type-fest"
import { useCallback, useEffect, useState } from "react"
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge"
import { extractInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/list-item"
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine"
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter"
import {
  Accordion,
  Box,
  Button,
  FormControl,
  HStack,
  Icon,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react"
import {
  Actions,
  composePaths,
  createDefaultValue,
  findUISchema,
  getSubErrorsAt,
  rankWith,
  schemaMatches,
} from "@jsonforms/core"
import { useJsonForms, withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import get from "lodash/get"
import { BiPlusCircle } from "react-icons/bi"

import type { NavbarItems } from "./types"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { getParentPath } from "../utils"
import { EditNavbarItem } from "./EditNavbarItem"
import { StackableNavbarItem } from "./StackableNavbarItem"
import { handleMoveItem, isSubItemPath } from "./utils"

export const jsonFormsNavbarControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.NavbarControl,
  schemaMatches((schema) => schema.format === "navbar"),
)

export function JsonFormsNavbarControl({
  data,
  path,
  visible,
  addItem,
  removeItems,
  arraySchema,
  schema,
  rootSchema,
  renderers,
  cells,
  uischemas,
  uischema,
}: ArrayLayoutProps): JSX.Element {
  const ctx = useJsonForms()
  const [selectedPath, setSelectedPath] = useState<string>()
  const [droppableZoneElement, setDroppableZoneElement] =
    useState<HTMLDivElement | null>(null)

  const droppableZoneCallbackRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node !== null) {
        setDroppableZoneElement(node)
      }
    },
    [],
  )

  const handleRemove = useCallback(
    (path: string, index: number) => {
      if (!removeItems) {
        return
      }

      removeItems(path, [index])()
    },
    [removeItems],
  )

  const handleMove = useCallback(
    (
      originalPath: string,
      newPath: string,
      instruction?: "reorder-before" | "reorder-after" | "combine",
      closestEdge?: Edge | null,
    ) => {
      ctx.dispatch?.(
        Actions.update(path, (prevData) =>
          handleMoveItem(
            prevData as NavbarItems["items"],
            originalPath,
            newPath,
            instruction,
            closestEdge,
          ),
        ),
      )
    },
    [ctx, path],
  )

  const getChildUiSchema = useCallback(
    (subPath: string) =>
      findUISchema(
        uischemas ?? [],
        schema,
        uischema.scope,
        subPath,
        undefined,
        uischema,
        rootSchema,
      ),
    [rootSchema, schema, uischema, uischemas],
  )

  useEffect(() => {
    if (!droppableZoneElement) {
      return
    }

    return combine(
      // Navbar dropzone
      dropTargetForElements({
        element: droppableZoneElement,
        canDrop: (args) => {
          const originalPath = args.source.data.navbarId as string

          // Disallow subitems from being dropped into the main navbar if the
          // maxItems limit has been reached
          return !(
            isSubItemPath(originalPath) &&
            arraySchema.maxItems &&
            data >= arraySchema.maxItems
          )
        },
        onDrop: (args) => {
          // NOTE: The data on the navbar can be obtained from args.source.data.*
          // The dropzone can be found at args.location.current.dropTargets[0]
          const originalPath = args.source.data.navbarId as string
          const newDestination = args.location.current.dropTargets[0]?.data

          if (!newDestination) {
            return
          }

          const newPath = newDestination.dropTargetId as string | undefined
          const closestEdge = extractClosestEdge(newDestination)
          const instruction = extractInstruction(newDestination)

          if (newPath === undefined) {
            return
          }

          handleMove(originalPath, newPath, instruction?.operation, closestEdge)
        },
        getIsSticky: () => true,
      }),
    )
  }, [arraySchema.maxItems, data, droppableZoneElement, handleMove])

  if (selectedPath !== undefined) {
    return (
      <EditNavbarItem
        renderers={renderers}
        cells={cells}
        visible={visible}
        schema={schema}
        uischema={getChildUiSchema(selectedPath)}
        path={selectedPath}
        onBack={() => setSelectedPath(undefined)}
        handleRemoveItem={() =>
          handleRemove(
            getParentPath(selectedPath),
            Number(selectedPath.split(".").pop()),
          )
        }
      />
    )
  }

  return (
    <Box>
      <FormControl isRequired>
        <VStack gap="0.75rem" py="1rem" alignItems="start">
          {data === 0 && (
            <VStack gap="1rem" w="full" px="1.5rem" py="3rem">
              <VStack gap="0.25rem" w="22.5rem" textAlign="center">
                <Text textStyle="subhead-1" textColor="base.content.default">
                  Start adding links to the navigation menu
                </Text>

                <Text textStyle="caption-2" textColor="base.content.medium">
                  You can help users navigate to critical pages using the
                  navigation menu
                </Text>
              </VStack>

              <Button
                variant="outline"
                leftIcon={<Icon as={BiPlusCircle} fontSize="1.25rem" />}
                onClick={addItem(path, createDefaultValue(schema, rootSchema))}
              >
                Add a link
              </Button>
            </VStack>
          )}

          {data !== 0 && (
            <>
              <HStack w="full" justifyContent="space-between">
                <Text textStyle="body-2" textColor="base.content.medium">
                  {arraySchema.maxItems ? (
                    <>
                      {data}/{arraySchema.maxItems} links added
                    </>
                  ) : (
                    <>
                      {data} link{data > 1 ? "s" : ""} added
                    </>
                  )}
                </Text>

                <Tooltip
                  label={
                    arraySchema.maxItems && data >= arraySchema.maxItems
                      ? `You can only place up to ${arraySchema.maxItems} links on the first level.`
                      : undefined
                  }
                  hasArrow
                >
                  <Button
                    variant="clear"
                    size="xs"
                    leftIcon={<Icon as={BiPlusCircle} />}
                    onClick={addItem(
                      path,
                      createDefaultValue(schema, rootSchema),
                    )}
                    isDisabled={
                      arraySchema.maxItems
                        ? data >= arraySchema.maxItems
                        : false
                    }
                  >
                    Add a link
                  </Button>
                </Tooltip>
              </HStack>

              <Accordion
                ref={droppableZoneCallbackRef}
                w="full"
                display="flex"
                flexDir="column"
                gap="0.75rem"
                allowToggle
              >
                {[...Array(data).keys()].map((index) => {
                  const childPath = composePaths(path, String(index))
                  const arrayErrors = getSubErrorsAt(
                    childPath,
                    schema,
                  )({ jsonforms: ctx })

                  const childItem = get(
                    ctx.core?.data,
                    childPath,
                  ) as PartialDeep<NavbarItems["items"][number]>

                  return (
                    <StackableNavbarItem
                      index={index}
                      name={childItem.name}
                      errors={arrayErrors}
                      description={childItem.description}
                      onEdit={(subItemIndex) => {
                        if (subItemIndex !== undefined) {
                          setSelectedPath(
                            composePaths(
                              [childPath, "items"].join("."),
                              String(subItemIndex),
                            ),
                          )
                        } else {
                          setSelectedPath(childPath)
                        }
                      }}
                      removeItem={(subItemIndex) => {
                        if (subItemIndex !== undefined) {
                          handleRemove(
                            [childPath, "items"].join("."),
                            subItemIndex,
                          )
                        } else {
                          handleRemove(path, index)
                        }
                      }}
                      subItems={childItem.items}
                    />
                  )
                })}
              </Accordion>
            </>
          )}
        </VStack>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsArrayLayoutProps(JsonFormsNavbarControl)
