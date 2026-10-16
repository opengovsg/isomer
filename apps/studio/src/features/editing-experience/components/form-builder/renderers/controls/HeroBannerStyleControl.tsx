import type {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  UISchemaElement,
} from "@jsonforms/core"
import { Box, Flex, FormControl, Icon, Text, VStack } from "@chakra-ui/react"
import { JsonFormsDispatch } from "@jsonforms/react"
import { Button, FormLabel } from "@opengovsg/design-system-react"
import {
  getHeroStyleVariantForBranchTitle,
  HERO_STYLE,
  type HeroStyleVariant,
} from "@opengovsg/isomer-components"
import { useId, useState } from "react"
import { BiCheck, BiChevronRight } from "react-icons/bi"
import { NewFeatureBadge } from "~/features/editing-experience/components/shared/NewFeatureBadge"

import { DrawerHeader } from "../../../Drawer/DrawerHeader"

interface HeroBannerStyleOption {
  label: string
  value: string
  key: HeroStyleVariant
}

const HERO_BANNER_STYLE_VARIANTS_WITH_NEW_BADGE = new Set<HeroStyleVariant>([
  HERO_STYLE.gradient.key,
] satisfies readonly HeroStyleVariant[])

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
    boxShadow: "0rem 0.0625rem 0.375rem 0rem #1361F026",
  },
}

const heroBannerStyleAccentColorProps = {
  color: "base.content.default",
  transitionProperty: "common",
  transitionDuration: "normal",
  _groupHover: { color: "utility.feedback.info" },
  _groupActive: { color: "utility.feedback.info" },
}

function HeroBannerStyleTrigger({
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
      role="group"
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
        <Flex align="center" minW={0}>
          <Text textStyle="subhead-1" {...heroBannerStyleAccentColorProps}>
            {label}
          </Text>
          <NewFeatureBadge ml="0.5rem" aria-hidden />
        </Flex>
        <Text textStyle="caption-2" color="base.content.default">
          Click to explore different styles
        </Text>
      </Flex>
      <Icon
        as={BiChevronRight}
        boxSize="1.5rem"
        flexShrink={0}
        aria-hidden
        {...heroBannerStyleAccentColorProps}
      />
    </Flex>
  )
}

function HeroBannerStyleDrawer({
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
                role="group"
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
                _hover={
                  isSelected
                    ? undefined
                    : heroBannerStyleBlockInteractionProps._hover
                }
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
                  src={`/assets/hero-banner-style/${option.key}.png`}
                  alt=""
                  w="123px"
                  h="76px"
                  maxW="240px"
                  flexShrink={0}
                  objectFit="cover"
                  borderRadius="0.25rem"
                  boxShadow="0 0 20px 0 rgba(104, 104, 104, 0.30)"
                />
                <Flex flex="1" minW={0} alignItems="center" gap="0.5rem">
                  <Flex flex="1" minW={0} align="center">
                    <Text
                      textStyle="subhead-1"
                      {...(isSelected
                        ? { color: "utility.feedback.info" }
                        : heroBannerStyleAccentColorProps)}
                    >
                      {option.label}
                    </Text>
                    {HERO_BANNER_STYLE_VARIANTS_WITH_NEW_BADGE.has(
                      option.key,
                    ) && <NewFeatureBadge ml="0.5rem" aria-hidden />}
                  </Flex>
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

interface HeroBannerStyleRenderInfo {
  label: string
  schema: JsonSchema
  uischema: UISchemaElement
}

function combinatorOptionFromRenderInfo(renderInfo: HeroBannerStyleRenderInfo) {
  const option = String(renderInfo.label || renderInfo.schema.const)

  return {
    label: option.charAt(0).toUpperCase() + option.slice(1),
    value: option,
  }
}

export function HeroBannerStyleCombinator({
  label,
  description,
  renderInfos,
  variant,
  onChange,
  activeRenderInfo,
  path,
  renderers,
  cells,
}: {
  label: string | undefined
  description: string | undefined
  renderInfos: HeroBannerStyleRenderInfo[]
  variant: string
  onChange: (value: string) => void
  activeRenderInfo: HeroBannerStyleRenderInfo | undefined
  path: string
  renderers: JsonFormsRendererRegistryEntry[] | undefined
  cells: JsonFormsCellRendererRegistryEntry[] | undefined
}) {
  const [isOpen, setIsOpen] = useState(false)

  const options = renderInfos
    .map((renderInfo) => {
      const option = combinatorOptionFromRenderInfo(renderInfo)
      const isHidden = renderInfo.schema.format === "hidden"
      const isSelected = option.label === variant || option.value === variant

      if (isHidden && !isSelected) {
        return null
      }

      const variantKey = getHeroStyleVariantForBranchTitle(option.value)

      return {
        ...option,
        key: (variantKey ?? option.value) as HeroStyleVariant,
      }
    })
    .filter((option) => option !== null)

  const selected = options.find(
    (option) => option.label === variant || option.value === variant,
  )

  if (isOpen) {
    return (
      <HeroBannerStyleDrawer
        options={options}
        value={selected?.value ?? ""}
        onChange={onChange}
        onClose={() => setIsOpen(false)}
      />
    )
  }

  return (
    <>
      <Box>
        <FormControl isRequired gap="0.5rem">
          <FormLabel description={description}>{label || "Variant"}</FormLabel>
          <HeroBannerStyleTrigger
            label={selected?.label ?? ""}
            onOpen={() => setIsOpen(true)}
          />
        </FormControl>
      </Box>
      {activeRenderInfo && (
        <JsonFormsDispatch
          key={activeRenderInfo.label}
          uischema={activeRenderInfo.uischema}
          schema={activeRenderInfo.schema}
          path={path}
          renderers={renderers}
          cells={cells}
        />
      )}
    </>
  )
}
