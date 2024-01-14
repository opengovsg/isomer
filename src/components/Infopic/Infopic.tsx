import { HStack, Link, Image, Text, VStack } from "@chakra-ui/react"
import type { FlexProps } from "@chakra-ui/react"
import { useIsMobile, Button } from "@opengovsg/design-system-react"
import { HomepageSectionWrapper } from "../HomepageSectionWrapper"

import { BiRightArrowAlt } from "react-icons/bi"

export interface InfopicProps extends FlexProps {
  sectionIndex: number
  title?: string
  subtitle?: string
  description?: string
  alt?: string
  image?: string
  button?: string
  url?: string
}

const TextComponent = ({
  title,
  subtitle,
  description,
  button,
  url,
}: Omit<InfopicProps, "sectionIndex" | "image" | "alt">) => {
  return (
    <VStack alignSelf="center" alignItems="start" gap="1rem" w="100%" h="100%">
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
  )
}

interface ImageComponentProps extends FlexProps {
  image?: InfopicProps["image"]
  alt?: InfopicProps["alt"]
}

const ImageComponent = ({ image, alt }: ImageComponentProps) => {
  return (
    <VStack w="100%">
      <Image src={image} alt={alt} maxW="100%"></Image>
    </VStack>
  )
}

export const Infopic = ({
  sectionIndex,
  title,
  subtitle,
  description,
  alt,
  image,
  button,
  url,
}: InfopicProps): JSX.Element => {
  const isMobile = useIsMobile({ ssr: false })
  const MobileView = () => {
    return (
      <VStack gap="2rem">
        <TextComponent
          title={title}
          subtitle={subtitle}
          description={description}
          button={button}
          url={url}
        />
        <ImageComponent image={image} alt={alt} />
      </VStack>
    )
  }
  return (
    <HomepageSectionWrapper sectionIndex={sectionIndex}>
      {isMobile ? (
        <MobileView />
      ) : (
        <HStack gap="3rem">
          {sectionIndex % 2 === 0 ? (
            <>
              <TextComponent
                title={title}
                subtitle={subtitle}
                description={description}
                button={button}
                url={url}
                w="50%"
              />
              <ImageComponent image={image} alt={alt} w="50%" />
            </>
          ) : (
            <>
              <ImageComponent image={image} alt={alt} />
              <TextComponent
                title={title}
                subtitle={subtitle}
                description={description}
                button={button}
                url={url}
              />
            </>
          )}
        </HStack>
      )}
    </HomepageSectionWrapper>
  )
}

export default Infopic
