import type { ControlProps, RankedTester } from "@jsonforms/core"
import type { JsonFormsCellRendererRegistryEntry, JsonFormsRendererRegistryEntry } from "@jsonforms/core"
import type { PropsWithChildren } from "react"
import { rankWith, schemaMatches } from "@jsonforms/core"
import { JsonFormsDispatch, withJsonFormsControlProps } from "@jsonforms/react"
import { Box } from "@chakra-ui/react"
import { CollectionPageCategoriesSchema } from "@opengovsg/isomer-components"
import { createContext, useContext } from "react"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

import { JsonFormsTextControl } from "./JsonFormsTextControl"

const CATEGORY_LABEL_PATH = "categoryLabel"

const CategoryLabelRenderContext = createContext(false)

export function CategoryLabelRenderProvider({
  children,
}: PropsWithChildren): JSX.Element {
  return (
    <CategoryLabelRenderContext.Provider value={true}>
      {children}
    </CategoryLabelRenderContext.Provider>
  )
}

export const jsonFormsCategoryLabelControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.CategoryLabelControl,
  schemaMatches((schema) => schema.format === "category-label"),
)

function JsonFormsCategoryLabelControl(props: ControlProps): JSX.Element | null {
  const show = useContext(CategoryLabelRenderContext)
  if (!show) {
    return null
  }

  return <JsonFormsTextControl {...props} />
}

export default withJsonFormsControlProps(JsonFormsCategoryLabelControl)

export function CategoryLabelEditor({
  enabled,
  renderers,
  cells,
  visible,
}: {
  enabled?: boolean
  renderers?: JsonFormsRendererRegistryEntry[]
  cells?: JsonFormsCellRendererRegistryEntry[]
  visible?: boolean
}): JSX.Element {
  return (
    <CategoryLabelRenderProvider>
      <Box w="full" mb="1.25rem">
        <JsonFormsDispatch
          renderers={renderers}
          cells={cells}
          visible={visible}
          enabled={enabled}
          schema={CollectionPageCategoriesSchema}
          uischema={{
            type: "Control",
            scope: `#/properties/${CATEGORY_LABEL_PATH}`,
          }}
          path=""
        />
      </Box>
    </CategoryLabelRenderProvider>
  )
}
