import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import { Text, VStack } from "@chakra-ui/react"
import { rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

import { JsonFormsArrayControlView } from "./JsonFormsArrayControl"

const JsonFormsTagCategoryOptionsArrayLayout = withJsonFormsArrayLayoutProps(
  (props: ArrayLayoutProps) => (
    <JsonFormsArrayControlView
      {...props}
      emptyState={
        <VStack spacing="0.25rem" align="center">
          <Text
            textStyle="subhead-2"
            textColor="base.content.default"
            textAlign="center"
          >
            Add an option to save this filter
          </Text>
          <Text
            textStyle="caption-2"
            textColor="base.content.default"
            textAlign="center"
          >
            Users will choose from this list when creating new items.
          </Text>
        </VStack>
      }
    />
  ),
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
