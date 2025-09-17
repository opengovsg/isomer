import NextLink from "next/link"
import { Link, Text } from "@chakra-ui/react"

interface SettingsItemProps {
  label: string
  href: string
  isActive?: boolean
}
export const SettingsItem = ({ isActive, label, href }: SettingsItemProps) => {
  return (
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
        textColor={
          isActive ? "interaction.main.default" : "base.content.default"
        }
      >
        {label}
      </Text>
    </Link>
  )
}
