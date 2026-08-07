import { Text, VStack } from "@chakra-ui/react"

import { GAZETTE_UNRESOLVED_TAG_LABEL } from "../../constants"
import { useGazetteSubcategoriesContext } from "../../contexts/GazetteSubcategoriesContext"

interface CategoryCellProps {
  category: string | null
  subcategory: string | null
}

export const CategoryCell = ({
  category,
  subcategory,
}: CategoryCellProps): JSX.Element => {
  const { categoryMap, subcategoryMap } = useGazetteSubcategoriesContext()

  // A non-null id was found *by* looking it up in these maps, so the `??` here
  // only satisfies noUncheckedIndexedAccess. The null branch is the real one:
  // an unresolved tag renders as an explicit "Unknown" in the critical colour
  // rather than a blank cell, which would be indistinguishable from a gazette
  // that legitimately has no category.
  const categoryLabel = category
    ? (categoryMap[category] ?? GAZETTE_UNRESOLVED_TAG_LABEL)
    : GAZETTE_UNRESOLVED_TAG_LABEL
  const subcategoryLabel = subcategory
    ? (subcategoryMap[subcategory] ?? GAZETTE_UNRESOLVED_TAG_LABEL)
    : GAZETTE_UNRESOLVED_TAG_LABEL

  return (
    <VStack spacing="0.25rem" align="start">
      <Text
        textStyle="subhead-2"
        color={category ? "base.content.strong" : "utility.feedback.critical"}
      >
        {categoryLabel}
      </Text>
      <Text
        textStyle="caption-2"
        color={
          subcategory ? "base.content.medium" : "utility.feedback.critical"
        }
        fontSize="sm"
      >
        {subcategoryLabel}
      </Text>
    </VStack>
  )
}
