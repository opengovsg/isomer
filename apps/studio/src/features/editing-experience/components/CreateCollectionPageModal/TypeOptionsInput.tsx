import type { UseRadioGroupProps, UseRadioProps } from "@chakra-ui/react"
import { forwardRef, useMemo } from "react"
import {
  Box,
  Flex,
  Icon,
  Stack,
  Text,
  useMultiStyleConfig,
  useRadio,
  useRadioGroup,
} from "@chakra-ui/react"
import { Badge } from "@opengovsg/design-system-react"
import { BiFile, BiUpload } from "react-icons/bi"

import type { CollectionItemType } from "./constants"
import { COLLECTION_ITEM_TYPES } from "./constants"

interface TypeTileProps extends UseRadioProps {
  value: CollectionItemType
}

const TypeOptionRadio = forwardRef<HTMLInputElement, TypeTileProps>(
  (props, ref) => {
    const styles = useMultiStyleConfig("Tile", {})
    const isDisabled = props.value === "pdf"

    const { getInputProps, getRadioProps } = useRadio({
      ...props,
      isDisabled,
    })
    const input = getInputProps(undefined, ref)
    const checkbox = getRadioProps()
    const { value } = props

    const { TileIcon, title, description, badge } = useMemo(() => {
      switch (value) {
        case "page": {
          return {
            TileIcon: BiFile,
            title: "Page",
            description:
              "Select this option if you want an empty page where you can place article content.",
            badge: (
              <Badge variant="subtle" colorScheme="success" size="xs">
                Default
              </Badge>
            ),
          }
        }
        case "pdf": {
          return {
            TileIcon: BiUpload,
            title: "PDF file",
            description:
              "Select this option if you want to upload a single PDF file as a resource. This option is currently under development and will be available soon.",
          }
        }
      }
    }, [value])

    return (
      <Box as="label" {...(isDisabled && { cursor: "not-allowed" })}>
        <input {...input} />
        <Box
          {...checkbox}
          sx={styles.container}
          _checked={{
            bg: "brand.primary.50",
            borderColor: "utility.focus-default",
            boxShadow: "0 0 0 1px var(--chakra-colors-utility-focus-default)",
          }}
          data-group
          cursor="pointer"
          _disabled={{
            pointerEvents: "none",
            bgColor: "base.canvas.alt",
          }}
        >
          <Flex
            p="0.5rem"
            bg="brand.secondary.100"
            borderRadius="4px"
            w="2.25rem"
            h="2.25rem"
            align="center"
            justify="center"
            _groupChecked={{
              bg: "brand.primary.100",
              color: "base.content.brand",
            }}
          >
            <Icon as={TileIcon} fontSize="1.25rem" />
          </Flex>
          <Stack flexDir="row" mt="1rem">
            <Text
              textStyle="h6"
              _groupChecked={{
                color: "base.content.brand",
              }}
              _groupDisabled={{
                textColor: "interaction.support.disabled-content",
              }}
            >
              {title}
            </Text>
            {badge}
          </Stack>
          <Text
            _groupDisabled={{
              textColor: "interaction.support.disabled-content",
            }}
            textStyle="body-1"
            mt="0.5rem"
          >
            {description}
          </Text>
        </Box>
      </Box>
    )
  },
)

type TypeOptionsInputProps = UseRadioGroupProps

export const TypeOptionsInput = forwardRef<
  HTMLInputElement,
  TypeOptionsInputProps
>((props, ref) => {
  const { getRootProps, getRadioProps } = useRadioGroup(props)

  const group = getRootProps()

  return (
    <Stack {...group} gap="2rem">
      {COLLECTION_ITEM_TYPES.map((value, index) => {
        const radio = getRadioProps({ value })
        return (
          <TypeOptionRadio
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
