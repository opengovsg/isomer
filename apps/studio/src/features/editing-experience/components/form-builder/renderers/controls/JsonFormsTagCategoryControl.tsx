import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import type { CollectionPagePageProps } from "@opengovsg/isomer-components"
import { Text } from "@chakra-ui/react"
import { rankWith, schemaMatches } from "@jsonforms/core"
import { useJsonForms, withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import { useCallback } from "react"
import { BiPurchaseTag } from "react-icons/bi"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

import { JsonFormsArrayControlView } from "./JsonFormsArrayControl"

const JsonFormsTagCategoriesArrayLayout = withJsonFormsArrayLayoutProps(
  (props: ArrayLayoutProps) => {
    const { core } = useJsonForms()
    const renderListItemSubtitle = useCallback(
      (index: number) => {
        // Collection metadata form uses the page object as JsonForms `data` (see CollectionEditorStateDrawer).
        const page = core?.data as CollectionPagePageProps | undefined
        const count = page?.tagCategories?.[index]?.options?.length ?? 0
        const optionsLabel = count <= 1 ? "option" : "options"
        return (
          <Text textStyle="caption-2" color="base.content.medium">
            {count} {optionsLabel}
          </Text>
        )
      },
      [core?.data],
    )

    return (
      <JsonFormsArrayControlView
        {...props}
        listItemIcon={BiPurchaseTag}
        renderListItemSubtitle={renderListItemSubtitle}
      />
    )
  },
)

export const jsonFormsTagCategoriesControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.TagCategoryControl,
  schemaMatches((schema) => schema.format === "tag-categories"),
)

const JsonFormsTagCategoriesControl = (props: ArrayLayoutProps) => {
  const { isAdmin: isUserIsomerAdmin } = useIsUserIsomerAdmin({
    roles: [IsomerAdminRole.Core, IsomerAdminRole.Migrator],
  })

  if (!isUserIsomerAdmin) {
    return null
  }

  return <JsonFormsTagCategoriesArrayLayout {...props} />
}

export default JsonFormsTagCategoriesControl
