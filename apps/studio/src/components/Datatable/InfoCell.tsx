import { memo } from "react"
import NextLink from "next/link"
import { Link, Text, VStack } from "@chakra-ui/react"

export interface InfoCellProps {
  caption?: string | null
  subcaption?: string | null
  href?: string
}

export const InfoCell = memo(
  ({ caption, subcaption, href }: InfoCellProps): JSX.Element => {
    return (
      <VStack align="start" spacing="0.25rem">
        {href ? (
          <Link
            as={NextLink}
            color="base.content.strong"
            href={href}
            textStyle="subhead-2"
          >
            {caption}
          </Link>
        ) : (
          <Text textStyle="body-2">{caption}</Text>
        )}
        <Text textStyle="body-2">{subcaption}</Text>
      </VStack>
    )
  },
  (prevProps, nextProps) => {
    return (
      prevProps.caption === nextProps.caption &&
      prevProps.subcaption === nextProps.subcaption
    )
  },
)

InfoCell.displayName = "InfoCell"
