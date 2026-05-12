import { Text, VStack } from "@chakra-ui/react"

interface CategoryCellProps {
  category: string
  subcategory: string
}

export const CategoryCell = ({
  category,
  subcategory,
}: CategoryCellProps): JSX.Element => {
  return (
    <VStack spacing="0.25rem" align="start">
      <Text textStyle="subhead-2" color="base.content.strong" noOfLines={1}>
        {category}
      </Text>
      <Text textStyle="caption-2" color="base.content.medium" noOfLines={1}>
        {subcategory}
      </Text>
    </VStack>
  )
}
