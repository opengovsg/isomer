import type { IconType } from "react-icons"
import NextLink from "next/link"
import {
  AccordionButton,
  AccordionIcon,
  Box,
  Icon,
  Text,
} from "@chakra-ui/react"
import { Button, Spinner } from "@opengovsg/design-system-react"

interface RowEntryProps {
  icon: IconType
  label: string
  href: string
  isFetchingChildren?: boolean
  isActive: boolean
  isExpandable: boolean
  level: number
}

export const RowEntry = ({
  icon,
  label,
  href,
  isFetchingChildren,
  isActive,
  isExpandable,
  level,
}: RowEntryProps) => {
  const accordionPosLeft = level * 1.25 + 0.75
  const buttonSpacingLeft = accordionPosLeft + 0.625

  return (
    <Box pos="relative">
      <Button
        as={NextLink}
        data-group
        gap="0.25rem"
        w="full"
        variant="clear"
        px="0.5rem"
        py="0.38rem"
        justifyContent="flex-start"
        isActive={isActive}
        href={href}
        leftIcon={<Box w={`${buttonSpacingLeft}rem`} />}
        iconSpacing="0rem"
        title={label}
      >
        <Icon color="base.content.default" as={icon} flexShrink={0} />
        <Text
          ml="0.25rem"
          noOfLines={1}
          textColor="base.content.default"
          textAlign="left"
          textStyle="subhead-2"
        >
          {label}
        </Text>
      </Button>
      {isExpandable && (
        <AccordionButton
          pos="absolute"
          w="1.25rem"
          p={0}
          left={`${accordionPosLeft}rem`}
          top="0.75rem"
        >
          {isFetchingChildren ? (
            <Spinner />
          ) : (
            <AccordionIcon color="interaction.support.unselected" />
          )}
        </AccordionButton>
      )}
    </Box>
  )
}
