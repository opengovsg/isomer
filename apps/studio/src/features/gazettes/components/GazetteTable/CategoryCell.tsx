import { Text, VStack } from "@chakra-ui/react"

import { useGazetteSubcategoriesContext } from "../../contexts/GazetteSubcategoriesContext"

interface CategoryCellProps {
  category: string
  subcategory: string
}

export const CategoryCell = ({
  category,
  subcategory,
}: CategoryCellProps): JSX.Element => {
  const { subcategoryMap } = useGazetteSubcategoriesContext()

  return (
    <VStack spacing="0.25rem" align="start">
      <Text textStyle="subhead-2" color="base.content.strong">
        {category}
      </Text>
      <Text textStyle="caption-2" color="base.content.medium">
        {subcategoryMap[subcategory] ?? subcategory}
      </Text>
    </VStack>
  )
}
