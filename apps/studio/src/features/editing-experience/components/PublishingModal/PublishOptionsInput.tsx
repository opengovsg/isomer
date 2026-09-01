import type { UseRadioGroupProps, UseRadioProps } from "@chakra-ui/react"
import {
  Box,
  Flex,
  Icon,
  Stack,
  Text,
  useRadio,
  useRadioGroup,
} from "@chakra-ui/react"
import { forwardRef, useMemo } from "react"
import { BiShow, BiTimeFive } from "react-icons/bi"

export const PUBLISH_MODES = ["now", "later"] as const
export type PublishMode = (typeof PUBLISH_MODES)[number]

interface PublishOptionRadioProps extends UseRadioProps {
  value: PublishMode
}

const PublishOptionRadio = forwardRef<
  HTMLInputElement,
  PublishOptionRadioProps
>((props, ref) => {
  const { getInputProps, getRadioProps } = useRadio(props)
  const input = getInputProps(undefined, ref)
  const checkbox = getRadioProps()
  const { value } = props

  const { icon, title, description } = useMemo(() => {
    switch (value) {
      case "now":
        return {
          icon: BiShow,
          title: "Publish now",
          description:
            "Changes will be live on your site in approximately 5–10 minutes.",
        }
      case "later":
        return {
          icon: BiTimeFive,
          title: "Publish later",
          description:
            "Publish the page at a later time and change its status to Live.",
        }
    }
  }, [value])

  return (
    <Box as="label">
      <input {...input} />
      <Flex
        {...checkbox}
        cursor="pointer"
        gap="0.75rem"
        alignItems="flex-start"
        borderWidth="1px"
        borderRadius="0.5rem"
        borderColor="base.divider.medium"
        p="1rem"
        _checked={{
          bg: "brand.primary.50",
          borderColor: "utility.focus-default",
          boxShadow: "0 0 0 1px var(--chakra-colors-utility-focus-default)",
        }}
      >
        <Icon
          as={icon}
          boxSize="1.25rem"
          mt="0.125rem"
          color="base.content.default"
        />
        <Stack spacing="0.25rem">
          <Text textStyle="subhead-2" color="base.content.strong">
            {title}
          </Text>
          <Text textStyle="body-2" color="base.content.default">
            {description}
          </Text>
        </Stack>
      </Flex>
    </Box>
  )
})

type PublishOptionsInputProps = UseRadioGroupProps

export const PublishOptionsInput = forwardRef<
  HTMLInputElement,
  PublishOptionsInputProps
>((props, ref) => {
  const { getRootProps, getRadioProps } = useRadioGroup(props)
  const group = getRootProps()

  return (
    <Stack {...group} spacing="0.75rem">
      {PUBLISH_MODES.map((value, index) => {
        const radio = getRadioProps({ value })
        return (
          <PublishOptionRadio
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
