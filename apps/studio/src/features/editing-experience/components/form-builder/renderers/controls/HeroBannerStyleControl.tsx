import { Box, Flex, Icon, Text, VStack } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { useEffect, useId } from "react"
import { BiCheck, BiChevronRight } from "react-icons/bi"

import { DrawerHeader } from "../../../Drawer/DrawerHeader"

// Shared placeholder until each hero banner style has its own preview image.
const HERO_BANNER_STYLE_PLACEHOLDER_SRC =
  "/assets/hero-banner-style-placeholder.svg"

const EXPLORE_STYLES_LABEL = "Click to explore different styles"
const CHOOSE_STYLE_LABEL = "Choose a hero banner style"

export interface HeroBannerStyleOption {
  label: string
  value: string
}

function HeroBannerStyleThumbnail() {
  return (
    <Box
      as="img"
      src={HERO_BANNER_STYLE_PLACEHOLDER_SRC}
      alt=""
      w="123px"
      h="76px"
      maxW="240px"
      flexShrink={0}
      objectFit="cover"
      borderRadius="0.25rem"
      boxShadow="0 0 20px 0 rgba(104, 104, 104, 0.30)"
    />
  )
}

export function HeroBannerStyleTrigger({
  label,
  onOpen,
}: {
  label: string
  onOpen: () => void
}) {
  return (
    <Flex
      as="button"
      type="button"
      w="100%"
      alignItems="center"
      textAlign="left"
      py="1rem"
      px="1.25rem"
      borderWidth="2px"
      borderStyle="solid"
      borderColor="base.divider.medium"
      borderRadius="0.5rem"
      bg="utility.ui"
      cursor="pointer"
      onClick={onOpen}
      _hover={{
        borderColor: "utility.feedback.info",
        bg: "utility.feedback.info-subtle",
      }}
      _focusVisible={{
        outline: "2px solid",
        outlineColor: "utility.focus-default",
        outlineOffset: "2px",
      }}
    >
      <Flex
        direction="column"
        flex="1"
        minW={0}
        alignItems="flex-start"
        gap="0.25rem"
      >
        <Text textStyle="subhead-1" color="utility.feedback.info">
          {label}
        </Text>
        <Text textStyle="caption-2" color="base.content.medium">
          {EXPLORE_STYLES_LABEL}
        </Text>
      </Flex>
      <Icon
        as={BiChevronRight}
        boxSize="1.5rem"
        color="utility.feedback.info"
        flexShrink={0}
        aria-hidden
      />
    </Flex>
  )
}

export function HeroBannerStyleDrawer({
  options,
  value,
  onChange,
  onClose,
}: {
  options: HeroBannerStyleOption[]
  value: string
  onChange: (value: string) => void
  onClose: () => void
}) {
  const radioGroupName = useId()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  return (
    <VStack
      role="dialog"
      aria-label={CHOOSE_STYLE_LABEL}
      position="absolute"
      top={0}
      left={0}
      bg="grey.50"
      w="100%"
      h="100%"
      zIndex={1}
      gap={0}
    >
      <DrawerHeader
        label={CHOOSE_STYLE_LABEL}
        onBackClick={onClose}
        backAriaLabel="Back to hero banner"
      />
      <Box flex={1} minH={0} overflow="auto" w="100%" px="1.5rem" py="1rem">
        <Flex direction="column" gap="1rem">
          {options.map((option) => {
            const isSelected = option.value === value

            return (
              <Flex
                key={option.value}
                as="label"
                alignItems="center"
                cursor="pointer"
                py="1rem"
                px="1.25rem"
                gap="1.5rem"
                borderWidth="2px"
                borderStyle="solid"
                borderColor={
                  isSelected ? "utility.feedback.info" : "base.divider.medium"
                }
                borderRadius="0.5rem"
                bg={isSelected ? "utility.feedback.info-subtle" : "utility.ui"}
              >
                <Box
                  as="input"
                  type="radio"
                  name={radioGroupName}
                  value={option.value}
                  checked={isSelected}
                  onChange={() => onChange(option.value)}
                  srOnly
                />
                <HeroBannerStyleThumbnail />
                <Text
                  textStyle="subhead-1"
                  color="utility.feedback.info"
                  flex="1"
                  minW={0}
                >
                  {option.label}
                </Text>
                {isSelected && (
                  <Icon
                    as={BiCheck}
                    boxSize="1.25rem"
                    color="utility.feedback.info"
                    flexShrink={0}
                    aria-hidden
                  />
                )}
              </Flex>
            )
          })}
        </Flex>
      </Box>
      <Box
        flexShrink={0}
        bgColor="base.canvas.default"
        boxShadow="md"
        py="1.5rem"
        px="2rem"
        w="full"
      >
        <Button w="100%" onClick={onClose}>
          Save
        </Button>
      </Box>
    </VStack>
  )
}
