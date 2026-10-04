import { Box, Flex, Icon, Text, VStack } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { HERO_STYLE } from "@opengovsg/isomer-components"
import { useEffect, useId } from "react"
import { BiCheck, BiChevronRight } from "react-icons/bi"

import { DrawerHeader } from "../../../Drawer/DrawerHeader"

const HERO_BANNER_STYLE_ASSET_DIR = "/assets/hero-banner-style"

// Match Fixed blocks "Hero banner" row hover in BaseBlock.
const heroBannerStyleBlockInteractionProps = {
  layerStyle: "focusRing",
  transitionProperty: "common",
  transitionDuration: "normal",
  _hover: {
    bg: "interaction.muted.main.hover",
    borderColor: "interaction.main-subtle.hover",
  },
  _active: {
    bg: "interaction.main-subtle.default",
    borderColor: "interaction.main-subtle.hover",
    boxShadow: "0px 1px 6px 0px #1361F026",
  },
}

export interface HeroBannerStyleOption {
  label: string
  value: string
  key: string
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
      bg="white"
      cursor="pointer"
      onClick={onOpen}
      {...heroBannerStyleBlockInteractionProps}
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
          Click to explore different styles
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
      aria-label="Choose a hero banner style"
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
        label="Choose a hero banner style"
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
                bg={isSelected ? "utility.feedback.info-subtle" : "white"}
                {...heroBannerStyleBlockInteractionProps}
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
                <Box
                  as="img"
                  src={
                    option.key === HERO_STYLE.searchbar
                      ? `${HERO_BANNER_STYLE_ASSET_DIR}/placeholder.svg`
                      : `${HERO_BANNER_STYLE_ASSET_DIR}/${option.key}.png`
                  }
                  alt=""
                  w="123px"
                  h="76px"
                  maxW="240px"
                  flexShrink={0}
                  objectFit="cover"
                  borderRadius="0.25rem"
                  boxShadow="0 0 20px 0 rgba(104, 104, 104, 0.30)"
                />
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
