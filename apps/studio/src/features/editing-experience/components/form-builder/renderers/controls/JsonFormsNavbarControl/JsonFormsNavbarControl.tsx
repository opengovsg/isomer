import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/dist/types/closest-edge"
import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import type { PartialDeep } from "type-fest"
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
import { Infobox } from "@opengovsg/design-system-react"
import { get } from "lodash-es"
import { useCallback, useEffect, useMemo, useState } from "react"
import { BiPlusCircle } from "react-icons/bi"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

import type { NavbarItems } from "./types"
import { getParentPath } from "../utils"
import { EditNavbarItem } from "./EditNavbarItem"
import { StackableNavbarItem } from "./StackableNavbarItem"
import {
  getNavbarItemPath,
  handleMoveItem,
  isFirstLevelLinksOverLimit,
} from "./utils"

export const jsonFormsNavbarControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.NavbarControl,
  schemaMatches((schema) => schema.format === "navbar"),
)

function JsonFormsNavbarControl({
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
            !!(arraySchema.maxItems && data >= arraySchema.maxItems),
            originalPath,
            newPath,
            instruction,
            closestEdge,
          ),
        ),
      )
    },
    [arraySchema.maxItems, ctx, data, path],
  )

  const isTopLevelFull = !!(
    arraySchema.maxItems && data >= arraySchema.maxItems
  )

  const allTopLevelItems = useMemo(
    () =>
      [...Array(data).keys()].map((i) => {
        const item = get(ctx.core?.data, composePaths(path, String(i))) as
          | PartialDeep<NavbarItems["items"][number]>
          | undefined

        return { name: item?.name }
      }),
    [ctx.core?.data, data, path],
  )

  const isOverMaxItems = isFirstLevelLinksOverLimit(data, arraySchema.maxItems)

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
        handleRemoveItem={() => {
          handleRemove(
            getParentPath(selectedPath),
            Number(selectedPath.split(".").pop()),
          )
          setSelectedPath(undefined)
        }}
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
                  Start adding links to the navigation bar
                </Text>

                <Text textStyle="caption-2" textColor="base.content.medium">
                  You can help users navigate to critical pages using the
                  navigation bar
                </Text>
              </VStack>

              <Button
                variant="outline"
                leftIcon={<Icon as={BiPlusCircle} fontSize="1.25rem" />}
                onClick={() => {
                  addItem(path, createDefaultValue(schema, rootSchema))()
                  setSelectedPath(composePaths(path, String(data)))
                }}
              >
                Add a link
              </Button>
            </VStack>
          )}

          {data !== 0 && (
            <>
              <HStack w="full" justifyContent="space-between">
                <Text
                  textStyle="body-2"
                  textColor={
                    isOverMaxItems
                      ? "utility.feedback.critical"
                      : "base.content.medium"
                  }
                >
                  {arraySchema.maxItems ? (
                    <>
                      {data}/{arraySchema.maxItems} first-level links added
                    </>
                  ) : (
                    <>
                      {data} link{data > 1 ? "s" : ""} added
                    </>
                  )}
                </Text>

                <Button
                  variant="clear"
                  size="xs"
                  leftIcon={<Icon as={BiPlusCircle} />}
                  onClick={() => {
                    addItem(path, createDefaultValue(schema, rootSchema))()
                    setSelectedPath(composePaths(path, String(data)))
                  }}
                >
                  Add a link
                </Button>
              </HStack>

              {isOverMaxItems && (
                <Infobox variant="warning" size="sm" w="full">
                  <Text textStyle="body-2">
                    You can only have up to {arraySchema.maxItems} first-level
                    links. Move the extra links under an existing first-level
                    link, or remove them, before publishing.
                  </Text>
                </Infobox>
              )}

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
                      moveItem={(destinationParentIndex, subItemIndex) => {
                        if (subItemIndex !== undefined) {
                          const originalPath = getNavbarItemPath(
                            subItemIndex,
                            index,
                          )

                          if (destinationParentIndex === undefined) {
                            // Move the subitem out to become a top-level item
                            handleMove(
                              originalPath,
                              getNavbarItemPath(Math.max(data - 1, 0)),
                            )
                          } else {
                            handleMove(
                              originalPath,
                              getNavbarItemPath(destinationParentIndex),
                              "combine",
                            )
                          }
                        } else if (destinationParentIndex !== undefined) {
                          // Move this top-level item to become a subitem of
                          // another top-level item
                          handleMove(
                            getNavbarItemPath(index),
                            getNavbarItemPath(destinationParentIndex),
                            "combine",
                          )
                        }
                      }}
                      subItems={childItem.items}
                      allTopLevelItems={allTopLevelItems}
                      isTopLevelFull={isTopLevelFull}
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
