import { Link, Text } from "@chakra-ui/react"
import NextLink from "next/link"
import {
  hasNonEmptyString,
  isDefinedNumber,
  isNullableBooleanTrue,
  isNonEmptyArray,
} from "~/utils/truthiness"

interface SettingsItemProps {
  label: string
  href: string
  isActive?: boolean
}
export const SettingsItem = ({ isActive, label, href }: SettingsItemProps) => (
  <Link
    as={NextLink}
    variant="inline"
    href={href}
    textDecoration="none"
    px="0.5rem"
    py="0.25rem"
    w="100%"
    _hover={{
      bgColor: "interaction.muted.main.hover",
    }}
  >
    <Text
      textStyle="subhead-2"
      aria-current={isNullableBooleanTrue(isActive) && "page"}
      _activeLink={{
        textColor: "interaction.main.default",
      }}
      textColor="base.content.default"
    >
      {label}
    </Text>
  </Link>
)
