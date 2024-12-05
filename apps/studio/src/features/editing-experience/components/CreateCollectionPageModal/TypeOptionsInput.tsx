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
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { CollectionItemType } from "./constants"
import { getIcon } from "~/utils/resources"
import { COLLECTION_ITEM_TYPES } from "./constants"

interface TypeTileProps extends UseRadioProps {
  value: CollectionItemType
}

const TypeOptionRadio = forwardRef<HTMLInputElement, TypeTileProps>(
  (props, ref) => {
    const styles = useMultiStyleConfig("Tile", {})

    const { getInputProps, getRadioProps } = useRadio(props)
    const input = getInputProps(undefined, ref)
    const checkbox = getRadioProps()
    const { value } = props

    const { TileIcon, title, description, badge } = useMemo(() => {
      switch (value) {
        case ResourceType.CollectionPage: {
          return {
            TileIcon: getIcon(value),
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
        case ResourceType.CollectionLink: {
          return {
            TileIcon: getIcon(value),
            title: "Link or file",
            description:
              "Select this option if you want to link to an existing page on your site, link an external page, or upload a PDF file.",
          }
        }
      }
    }, [value])

    return (
      <Box as="label">
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
            >
              {title}
            </Text>
            {badge}
          </Stack>
          <Text textStyle="body-1" mt="0.5rem">
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
