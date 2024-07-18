import type { UseRadioGroupProps, UseRadioProps } from "@chakra-ui/react"
import { forwardRef, useState } from "react"
import {
  Box,
  Flex,
  Stack,
  Text,
  useRadio,
  useRadioGroup,
  useToken,
  VStack,
} from "@chakra-ui/react"
import { Badge } from "@opengovsg/design-system-react"
import { BiShow } from "react-icons/bi"

import { NextImage } from "~/components/NextImage"

const LAYOUT_TYPES = ["content", "article"] as const
type Layout = (typeof LAYOUT_TYPES)[number]
interface LayoutTileProps extends UseRadioProps {
  value: Layout
}

const LAYOUT_RENDER_DATA: Record<
  Layout,
  {
    title: string
    description: string
    imageSrc: string
    altText: string
  }
> = {
  content: {
    title: "Default layout",
    description: "This is the most basic layout for your content.",
    imageSrc: "/assets/layout-card/default_layout_card.webp",
    altText: "Image preview of Default layout",
  },
  article: {
    title: "Article layout",
    description:
      "Designed for the perfect reading experience. Use this layout for text-heavy content, such as news, press releases, and speeches",
    imageSrc: "/assets/layout-card/article_layout_card.webp",
    altText: "Image preview of Article layout",
  },
}

const LayoutOptionRadio = forwardRef<HTMLInputElement, LayoutTileProps>(
  (props, ref) => {
    const [isHover, setIsHover] = useState(false)

    const hoverTileColorFullOpacity = useToken(
      "colors",
      "interaction.main-subtle.default",
    )
    // With opacity 60% -> hex 99
    const hoverTileColor = `${hoverTileColorFullOpacity}99`

    const { getInputProps, getRadioProps } = useRadio(props)
    const { value } = props
    const input = getInputProps(undefined, ref)
    const checkbox = getRadioProps()

    const { title, description, imageSrc, altText } = LAYOUT_RENDER_DATA[value]

    return (
      <Box as="label">
        <input {...input} />
        <VStack
          gap="1.25rem"
          align="start"
          role="group"
          {...checkbox}
          cursor="pointer"
        >
          <Box
            borderWidth="2px"
            borderRadius="8px"
            bg="interaction.muted.main.active"
            borderColor="base.divider.medium"
            onMouseEnter={() => setIsHover(true)}
            onMouseLeave={() => setIsHover(false)}
            _groupChecked={{
              borderColor: "base.divider.brand",
            }}
            transitionProperty="common"
            transitionDuration="normal"
            _hover={{
              borderColor: "interaction.main-subtle.hover",
            }}
            px="2rem"
            pt="1.5rem"
            position="relative"
          >
            <Flex
              borderRadius="8px"
              opacity={isHover ? 1 : 0}
              transitionProperty="common"
              transitionDuration="normal"
              flexDirection="column"
              position="absolute"
              bg={hoverTileColor}
              top={0}
              bottom={0}
              left={0}
              right={0}
              color="base.content.brand"
              align="center"
              justify="center"
              gap="0.25rem"
            >
              <BiShow fontSize="1.25rem" />
              <Text textStyle="caption-1">
                {input.checked ? "Previewing" : "Click to preview"}
              </Text>
            </Flex>
            <NextImage
              width={240}
              height={144}
              pointerEvents="none"
              priority
              src={imageSrc}
              borderTopRadius="4px"
              boxShadow="md"
              alt={altText}
            />
          </Box>
          <Stack>
            <Text
              textStyle="h6"
              color="base.content.strong"
              _groupChecked={{
                color: "base.content.brand",
              }}
            >
              {title}{" "}
              {input.checked && (
                <Badge variant="subtle" size="xs">
                  Previewing
                </Badge>
              )}
            </Text>
            <Text textStyle="body-1" color="base.content.default">
              {description}
            </Text>
          </Stack>
        </VStack>
      </Box>
    )
  },
)

type LayoutOptionsInputProps = UseRadioGroupProps

export const LayoutOptionsInput = forwardRef<
  HTMLInputElement,
  LayoutOptionsInputProps
>((props, ref) => {
  const { getRootProps, getRadioProps } = useRadioGroup(props)

  const group = getRootProps()

  return (
    <Stack {...group} gap="2rem">
      {LAYOUT_TYPES.map((value, index) => {
        const radio = getRadioProps({ value })
        return (
          <LayoutOptionRadio
            key={value}
            value={value}
            {...radio}
            ref={index === 0 ? ref : undefined}
          />
        )
      })}
    </Stack>
  )
})
