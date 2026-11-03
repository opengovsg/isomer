import { Flex, Icon, Text, VisuallyHidden } from "@chakra-ui/react"
import { useRef } from "react"
import { BiSolidInfoCircle } from "react-icons/bi"

import { useEditPageCarouselPreview } from "./EditPageCarouselPreviewProvider"

const MESSAGE =
  "Carousels don't autoplay in this preview. Switch to Full screen to see how they'll behave."

const pulseSx = {
  animation: "carouselPreviewNoticePulse 700ms ease-in-out 2",
  "@keyframes carouselPreviewNoticePulse": {
    "0%, 100%": {
      backgroundColor: "var(--chakra-colors-utility-feedback-info-subtle)",
      borderColor: "var(--chakra-colors-utility-feedback-info)",
    },
    "50%": {
      backgroundColor: "var(--chakra-colors-utility-feedback-info)",
      borderColor: "var(--chakra-colors-utility-feedback-info)",
    },
  },
  "@keyframes carouselPreviewNoticePulseText": {
    "0%, 100%": { color: "var(--chakra-colors-base-content-strong)" },
    "50%": { color: "var(--chakra-colors-base-content-inverse)" },
  },
  "@keyframes carouselPreviewNoticePulseIcon": {
    "0%, 100%": { color: "var(--chakra-colors-utility-feedback-info)" },
    "50%": { color: "var(--chakra-colors-base-content-inverse)" },
  },
  "& .chakra-text": {
    animation: "carouselPreviewNoticePulseText 700ms ease-in-out 2",
  },
  "& .chakra-icon": {
    animation: "carouselPreviewNoticePulseIcon 700ms ease-in-out 2",
  },
  "@media (prefers-reduced-motion: reduce)": {
    animation: "none",
    "& .chakra-text, & .chakra-icon": {
      animation: "none",
    },
  },
}

export const CarouselPreviewNotice = (): JSX.Element => {
  const attentionPulse = useEditPageCarouselPreview()?.attentionPulse ?? 0
  // A pulse that already happened should not replay when this notice mounts
  // again, such as after leaving full screen.
  const pulseAtMount = useRef(attentionPulse)
  const shouldPulse = attentionPulse > pulseAtMount.current

  return (
    <>
      <Flex
        key={attentionPulse}
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
        sx={shouldPulse ? pulseSx : undefined}
      >
        <Icon
          as={BiSolidInfoCircle}
          boxSize="1rem"
          color="utility.feedback.info"
          aria-hidden
          flexShrink={0}
        />
        <Text textStyle="body-2" color="base.content.strong">
          {MESSAGE}
        </Text>
        <VisuallyHidden role="status">
          {shouldPulse ? MESSAGE : ""}
        </VisuallyHidden>
      </Flex>
    </>
  )
}
