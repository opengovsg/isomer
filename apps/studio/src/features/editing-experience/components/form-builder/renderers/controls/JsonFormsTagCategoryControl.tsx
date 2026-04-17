import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import { rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import { BiPurchaseTag } from "react-icons/bi"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

import { JsonFormsArrayControlView } from "./JsonFormsArrayControl"

const JsonFormsTagCategoriesArrayLayout = withJsonFormsArrayLayoutProps(
  (props: ArrayLayoutProps) => (
    <JsonFormsArrayControlView {...props} listItemIcon={BiPurchaseTag} />
  ),
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
