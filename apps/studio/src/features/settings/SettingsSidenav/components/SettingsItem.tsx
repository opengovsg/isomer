import { Link, Text } from "@chakra-ui/react"
import NextLink from "next/link"

interface SettingsItemProps {
  label: string
  href: string
  isActive?: boolean
}
export const SettingsItem = ({ isActive, label, href }: SettingsItemProps) => {
  if (isActive) {
    return (
      <Text
        textStyle="subhead-2"
        aria-current="page"
        textColor="interaction.main.default"
        px="0.5rem"
        py="0.25rem"
        w="100%"
      >
        {label}
      </Text>
    )
  }

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
      <Text textStyle="subhead-2" textColor={"base.content.default"}>
        {label}
      </Text>
    </Link>
  )
}
