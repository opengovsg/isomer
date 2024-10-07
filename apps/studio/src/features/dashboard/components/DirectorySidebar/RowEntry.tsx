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
}

export const RowEntry = ({
  icon,
  label,
  href,
  isFetchingChildren,
  isActive,
  isExpandable,
}: RowEntryProps) => {
  return (
    <Box pos="relative">
      <Button
        as={NextLink}
        data-group
        gap="0.25rem"
        w="full"
        variant="clear"
        pl="0.75rem"
        pr="0.5rem"
        py="0.38rem"
        justifyContent="flex-start"
        isActive={isActive}
        href={href}
        rightIcon={isExpandable ? <Box w="1rem" /> : undefined}
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
          w="fit-content"
          p={0}
          right="0.75rem"
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
