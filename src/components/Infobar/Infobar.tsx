import { Link, Text, VStack } from "@chakra-ui/react"
import type { FlexProps } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { HomepageSectionWrapper } from "../HomepageSectionWrapper"

import { BiRightArrowAlt } from "react-icons/bi"

export interface InfobarProps extends FlexProps {
  sectionIndex: number
  title?: string
  subtitle?: string
  description?: string
  button?: string
  url?: string
}

export const Infobar = ({
  sectionIndex,
  title,
  subtitle,
  description,
  button,
  url,
}: InfobarProps): JSX.Element => {
  return (
    <HomepageSectionWrapper
      sectionIndex={sectionIndex}
      justifySelf={"center"}
      w="50%"
    >
      <VStack
        w="100%"
        alignSelf="center"
        alignItems="center"
        gap="1rem"
        textAlign={"center"}
      >
        {subtitle && (
          <Text textStyle="subtitle-2" textColor={"content.base"}>
            {subtitle}
          </Text>
        )}
        {title && (
          <Text textStyle="h1" textColor={"secondaryColour"}>
            {title}
          </Text>
        )}
        {description && (
          <Text textStyle="body-1" textColor={"content.base"}>
            {description}
          </Text>
        )}
        {button && (
          <Button
            whiteSpace={"initial"}
            h="100%"
            pl="0"
            textStyle={"link-button"}
            as={Link}
            href={url}
            aria-label={button}
            variant="clear"
            textColor={"secondaryColour"}
            _hover={{ textColor: "secondaryHover" }}
            rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
          >
            {button}
          </Button>
        )}
      </VStack>
    </HomepageSectionWrapper>
  )
}

export default Infobar
