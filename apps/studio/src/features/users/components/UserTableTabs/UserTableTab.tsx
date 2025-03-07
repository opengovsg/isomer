import React from "react"
import { Badge, Tab, Text, useTab } from "@chakra-ui/react"

interface UserTableTabProps {
  label: string
  count: number
}

export const UserTableTab = React.forwardRef<
  HTMLButtonElement,
  UserTableTabProps
>(({ label, count, ...props }, ref) => {
  const tabProps = useTab({ ...props, ref })
  const isSelected = !!tabProps["aria-selected"]

  return (
    <Tab
      {...tabProps}
      textTransform="none"
      transition="all 0.2s"
      _hover={{
        color: "base.content.brand",
        borderBottomColor: isSelected ? "base.content.brand" : "gray.200",
      }}
      _selected={{
        color: "base.content.brand",
        borderBottomColor: "base.content.brand",
      }}
      _focus={{
        outline: "none",
        boxShadow: "none",
      }}
      _focusVisible={{
        boxShadow: "outline",
        zIndex: 1,
      }}
    >
      <Text textStyle="subhead-2">{label}</Text>
      <Badge
        className="badge"
        variant={isSelected ? "solid" : "subtle"}
        colorScheme={isSelected ? "brand" : "neutral"}
        {...(isSelected && {
          bg: "base.content.brand",
          color: "base.content.inverse",
        })}
        size="xs"
        ml={1}
        borderRadius="full"
      >
        {count}
      </Badge>
    </Tab>
  )
})

UserTableTab.displayName = "UserTableTab"
