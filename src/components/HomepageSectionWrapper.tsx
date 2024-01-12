import { Flex } from "@chakra-ui/react"
import type { FlexProps } from "@chakra-ui/react"

interface HomepageSectionWrapperProps extends FlexProps {
  sectionIndex: number
}

export const HomepageSectionWrapper = ({
  sectionIndex,
  children,
  ...rest
}: HomepageSectionWrapperProps) => {
  return (
    <Flex
      backgroundColor={sectionIndex % 2 === 0 ? "canvas.base" : "canvas.grey"}
      py={["3rem", null, null, null, "6rem"]}
      px={["1.5rem", null, null, null, "3.25rem"]}
      w="100%"
      justifyContent={"center"}
      {...rest}
    >
      <Flex maxW={["", null, null, "60rem", "76rem", "80rem"]}>{children}</Flex>
    </Flex>
  )
}
