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

import type { Layout } from "./constants"
import { NextImage } from "~/components/NextImage"
import { siteSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { LAYOUT_RENDER_DATA } from "./constants"
import { useLayoutOptions } from "./useLayoutOptions"

interface LayoutTileProps extends UseRadioProps {
  value: Layout
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

    const isSelected = !!input.checked

    return (
      <Box as="label">
        <input {...input} />
        <VStack
          gap="1.25rem"
          align="start"
          role="group"
          {...checkbox}
          cursor="pointer"
          onMouseEnter={() => setIsHover(true)}
          onMouseLeave={() => setIsHover(false)}
        >
          <Box
            borderWidth="2px"
            borderRadius="8px"
            bg="interaction.muted.main.hover"
            borderColor="base.divider.medium"
            _groupChecked={{
              borderColor: "base.divider.brand",
              bg: "interaction.muted.main.active",
            }}
            transitionProperty="common"
            transitionDuration="normal"
            _groupHover={{
              borderColor: isSelected
                ? "base.divider.brand"
                : "interaction.main-subtle.hover",
            }}
            px="2rem"
            pt="1.5rem"
            position="relative"
          >
            <Flex
              borderRadius="8px"
              opacity={isHover && !isSelected ? 1 : 0}
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
              <Text textStyle="caption-1">Click to preview</Text>
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
            <Stack flexDir="row" align="center">
              <Text
                textStyle="h6"
                color="base.content.strong"
                _groupChecked={{
                  color: "base.content.brand",
                }}
                _groupHover={{
                  color: "base.content.brand",
                }}
              >
                {title}
              </Text>
              {isSelected && (
                <Badge h="min-content" variant="subtle" size="xs">
                  Previewing
                </Badge>
              )}
            </Stack>
            {isSelected && (
              <Text textStyle="body-1" color="base.content.default">
                {description}
              </Text>
            )}
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

  const { siteId } = useQueryParse(siteSchema)

  const { layoutOptions } = useLayoutOptions({ siteId })

  const entries = Object.entries(layoutOptions) as [
    keyof typeof layoutOptions,
    (typeof layoutOptions)[keyof typeof layoutOptions],
  ][]

  return (
    <Stack {...group} gap="2rem">
      {entries.map(([key, _value], index) => {
        const radio = getRadioProps({ value: key })
        return (
          <LayoutOptionRadio
            key={key}
            value={key}
            {...radio}
            ref={index === 0 ? ref : undefined}
          />
        )
      })}
    </Stack>
  )
})
