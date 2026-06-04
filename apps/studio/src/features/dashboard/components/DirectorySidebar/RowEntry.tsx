import type { IconType } from "react-icons"
import {
  AccordionButton,
  AccordionIcon,
  Box,
  Flex,
  Icon,
  Text,
} from "@chakra-ui/react"
import { Spinner } from "@opengovsg/design-system-react"
import { cn } from "@opengovsg/oui-theme"
import { ButtonLink } from "~/components/oui-bridge/ButtonLink"

interface RowEntryProps {
  icon: IconType
  label: string
  subLabel?: string
  href: string
  isFetchingChildren?: boolean
  isActive: boolean
  isExpandable: boolean
  level: number
}

export const RowEntry = ({
  icon,
  label,
  subLabel,
  href,
  isFetchingChildren,
  isActive,
  isExpandable,
  level,
}: RowEntryProps) => {
  const accordionPosLeft = level * 1.25 + 0.5
  const buttonSpacingLeft = accordionPosLeft + 0.25

  return (
    <Box pos="relative">
      <ButtonLink
        data-peer
        data-group
        variant="clear"
        // react-aria's Link strips `aria-selected`, so drive the active background off
        // `isActive` directly; `aria-current` carries the accessible "current page" state.
        aria-current={isActive ? "page" : undefined}
        href={href}
        title={label}
        className={cn(
          "h-auto min-h-[auto] w-full items-center justify-start gap-1 px-2 py-1.5 focus:z-[1]",
          isActive &&
            "bg-interaction-muted-main-active hover:bg-interaction-muted-main-active",
        )}
      >
        <Box w={`${buttonSpacingLeft}rem`} />
        <Icon
          color={isActive ? "interaction.main.default" : "base.content.default"}
          as={icon}
          flexShrink={0}
        />
        <Flex
          justify="space-between"
          align="center"
          flexDir="row"
          flex={1}
          gap="0.25rem"
          color={isActive ? "interaction.main.default" : "base.content.default"}
        >
          <Text
            ml="0.25rem"
            noOfLines={1}
            textAlign="left"
            textStyle="subhead-2"
          >
            {label}
          </Text>
          {subLabel && <Text textStyle="caption-3">{subLabel}</Text>}
        </Flex>
      </ButtonLink>
      {isExpandable && (
        <AccordionButton
          pos="absolute"
          display="flex"
          alignItems="center"
          w="1rem"
          p={0}
          left={`${accordionPosLeft}rem`}
          top="0.375rem"
          bottom="0.375rem"
          my="auto"
          _peerFocus={{
            zIndex: 1,
          }}
        >
          {isFetchingChildren ? (
            <Spinner />
          ) : (
            <AccordionIcon w="1rem" color="interaction.support.unselected" />
          )}
        </AccordionButton>
      )}
    </Box>
  )
}
