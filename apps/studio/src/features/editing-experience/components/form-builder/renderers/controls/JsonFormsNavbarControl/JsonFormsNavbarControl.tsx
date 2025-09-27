import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import type { NavbarItemsSchema } from "@opengovsg/isomer-components"
import type { Static } from "@sinclair/typebox"
import { useCallback, useState } from "react"
import {
  Accordion,
  Box,
  Button,
  FormControl,
  Icon,
  Text,
  VStack,
} from "@chakra-ui/react"
import {
  composePaths,
  createDefaultValue,
  findUISchema,
  rankWith,
  schemaMatches,
} from "@jsonforms/core"
import { useJsonForms, withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import get from "lodash/get"
import { BiPlusCircle } from "react-icons/bi"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { getParentPath } from "../utils"
import { EditNavbarItem } from "./EditNavbarItem"
import { StackableNavbarItem } from "./StackableNavbarItem"

type NavbarItems = Static<typeof NavbarItemsSchema>

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
  // moveUp,
  // moveDown,
  arraySchema,
  schema,
  rootSchema,
  renderers,
  cells,
  uischemas,
  uischema,
  // config,
}: ArrayLayoutProps): JSX.Element {
  const ctx = useJsonForms()
  const [selectedPath, setSelectedPath] = useState<string>()

  const handleRemove = useCallback(
    (path: string, index: number) => {
      if (!removeItems) {
        return
      }

      removeItems(path, [index])()
    },
    [removeItems],
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
              <Text textStyle="body-2" textColor="base.content.medium">
                {data}/{arraySchema.maxItems} links added
              </Text>

              <Accordion
                w="full"
                display="flex"
                flexDir="column"
                gap="0.75rem"
                allowMultiple
              >
                {[...Array(data).keys()].map((index) => {
                  const childPath = composePaths(path, String(index))

                  const childItem = get(
                    ctx.core?.data,
                    childPath,
                  ) as NavbarItems["items"][number]

                  return (
                    <StackableNavbarItem
                      key={JSON.stringify(childItem)}
                      name={childItem.name || "Navbar item"}
                      description={
                        childItem.description ||
                        "Add a description for this link"
                      }
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

              <Button
                variant="clear"
                size="xs"
                leftIcon={<Icon as={BiPlusCircle} />}
                w="full"
                onClick={addItem(path, createDefaultValue(schema, rootSchema))}
                isDisabled={
                  arraySchema.maxItems ? data >= arraySchema.maxItems : false
                }
              >
                Add a link
              </Button>
            </>
          )}
        </VStack>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsArrayLayoutProps(JsonFormsNavbarControl)
