import { Flex, Icon, Text } from "@chakra-ui/react"
import { BiSolidInfoCircle } from "react-icons/bi"

export const CarouselPreviewNotice = (): JSX.Element => {
  return (
    <Flex
      bg="utility.feedback.info-subtle"
      py="0.625rem"
      px="1rem"
      align="center"
      columnGap="0.5rem"
      mx="2rem"
      mt="0.75rem"
      borderRadius="8px"
      borderWidth="1px"
      borderColor="utility.feedback.info"
    >
      <Icon
        as={BiSolidInfoCircle}
        boxSize="1rem"
        color="utility.feedback.info"
        aria-hidden
        flexShrink={0}
      />
      <Text textStyle="body-2" color="base.content.strong">
        Carousels don't autoplay in this preview. Switch to Full screen to see
        how they'll behave.
      </Text>
    </Flex>
  )
}
