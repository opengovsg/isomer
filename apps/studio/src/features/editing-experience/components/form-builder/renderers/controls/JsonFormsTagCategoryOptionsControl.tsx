import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import { rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

import { JsonFormsArrayControlView } from "./JsonFormsArrayControl"

const JsonFormsTagCategoryOptionsArrayLayout = withJsonFormsArrayLayoutProps(
  (props: ArrayLayoutProps) => <JsonFormsArrayControlView {...props} />,
)

export const jsonFormsTagCategoryOptionsControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.TagCategoryOptionsControl,
  schemaMatches((schema) => schema.format === "tag-category-options"),
)

const JsonFormsTagCategoryOptionsControl = (props: ArrayLayoutProps) => {
  const { isAdmin: isUserIsomerAdmin } = useIsUserIsomerAdmin({
    roles: [IsomerAdminRole.Core, IsomerAdminRole.Migrator],
  })

  if (!isUserIsomerAdmin) {
    return null
  }

  return <JsonFormsTagCategoryOptionsArrayLayout {...props} />
}

export default JsonFormsTagCategoryOptionsControl
