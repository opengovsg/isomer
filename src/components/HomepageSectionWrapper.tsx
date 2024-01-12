import { Box } from "@chakra-ui/react"
import type { BoxProps } from "@chakra-ui/react"

interface HomepageSectionWrapperProps extends BoxProps {
  sectionIndex: number
}

export const HomepageSectionWrapper = ({
  sectionIndex,
  children,
  ...rest
}: HomepageSectionWrapperProps) => {
  return (
    <Box
      backgroundColor={sectionIndex % 2 === 0 ? "canvas.base" : "canvas.grey"}
      py="6rem"
      px="3.25rem"
      w="100%"
      {...rest}
    >
      {children}
    </Box>
  )
}
