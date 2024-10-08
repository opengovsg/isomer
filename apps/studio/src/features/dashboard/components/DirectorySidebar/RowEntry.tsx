import type { IconType } from "react-icons"
import NextLink from "next/link"
import {
  AccordionButton,
  AccordionIcon,
  Box,
  Flex,
  Icon,
  Text,
} from "@chakra-ui/react"
import { Button, Spinner } from "@opengovsg/design-system-react"

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
      <Button
        as={NextLink}
        data-peer
        data-group
        gap="0.25rem"
        w="full"
        variant="clear"
        minH="auto"
        h="auto"
        px="0.5rem"
        py="0.375rem"
        justifyContent="flex-start"
        aria-selected={isActive}
        href={href}
        leftIcon={<Box w={`${buttonSpacingLeft}rem`} />}
        iconSpacing="0.25rem"
        title={label}
        _selected={{
          bg: "interaction.muted.main.active",
          _hover: { bg: "interaction.muted.main.active" },
        }}
        _focus={{
          zIndex: 1,
        }}
      >
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
      </Button>
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
