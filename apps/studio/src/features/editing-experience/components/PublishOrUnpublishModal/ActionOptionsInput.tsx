import type { UseRadioGroupProps, UseRadioProps } from "@chakra-ui/react"
import type { IconType } from "react-icons"
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
import { BiHide, BiShow, BiTimeFive } from "react-icons/bi"

export const ACTION_MODES = ["now", "later"] as const
export type ActionMode = (typeof ACTION_MODES)[number]
export type PublishOrUnpublishAction = "publish" | "unpublish"

const COPY: Record<
  PublishOrUnpublishAction,
  Record<ActionMode, { icon: IconType; title: string; description: string }>
> = {
  publish: {
    now: {
      icon: BiShow,
      title: "Publish now",
      description:
        "Changes will be live on your site in approximately 5–10 minutes.",
    },
    later: {
      icon: BiTimeFive,
      title: "Publish later",
      description:
        "Publish the page at a later time and change its status to Live.",
    },
  },
  unpublish: {
    now: {
      icon: BiHide,
      title: "Unpublish now",
      description:
        "The page will be hidden from your site in approximately 5–10 minutes, and its status will change to Draft.",
    },
    later: {
      icon: BiTimeFive,
      title: "Unpublish later",
      description:
        "Hide the page at a later time and change its status to Draft.",
    },
  },
}

interface ActionOptionRadioProps extends UseRadioProps {
  action: PublishOrUnpublishAction
  value: ActionMode
}

const ActionOptionRadio = forwardRef<HTMLInputElement, ActionOptionRadioProps>(
  (props, ref) => {
    const { getInputProps, getRadioProps } = useRadio(props)
    const input = getInputProps(undefined, ref)
    const checkbox = getRadioProps()
    const { action, value } = props

    const { icon, title, description } = useMemo(
      () => COPY[action][value],
      [action, value],
    )

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
  },
)

type ActionOptionsInputProps = UseRadioGroupProps & {
  action: PublishOrUnpublishAction
}

export const ActionOptionsInput = forwardRef<
  HTMLInputElement,
  ActionOptionsInputProps
>(({ action, ...props }, ref) => {
  const { getRootProps, getRadioProps } = useRadioGroup(props)
  const group = getRootProps()

  return (
    <Stack {...group} spacing="0.75rem">
      {ACTION_MODES.map((value, index) => {
        const radio = getRadioProps({ value })
        return (
          <ActionOptionRadio
            key={value}
            action={action}
            value={value}
            {...radio}
            ref={index === 0 ? ref : undefined}
          />
        )
      })}
    </Stack>
  )
})
