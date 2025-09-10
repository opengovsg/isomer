import {
  ArrayLayoutProps,
  RankedTester,
  rankWith,
  schemaMatches,
} from "@jsonforms/core"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { ADMIN_ROLE } from "~/lib/growthbook"
import JsonFormsArrayControl from "./JsonFormsArrayControl"

export const jsonFormsTagCategoriesControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.TagCategoryControl,
  schemaMatches((schema) => schema.format === "tag-categories"),
)

export const JsonFormsTagCategoriesControl = (props: ArrayLayoutProps) => {
  const isUserIsomerAdmin = useIsUserIsomerAdmin({
    roles: [ADMIN_ROLE.CORE, ADMIN_ROLE.MIGRATORS],
  })

  if (!isUserIsomerAdmin) {
    return null
  }

  return <JsonFormsArrayControl {...props} />
}

export default JsonFormsTagCategoriesControl
