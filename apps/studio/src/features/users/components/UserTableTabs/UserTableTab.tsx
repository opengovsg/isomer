/* oxlint-disable unicorn/no-unnecessary-type-conversion -- core cleanup deferred */
import { Badge, Tab, Text, useTab } from "@chakra-ui/react"
import React from "react"

interface UserTableTabProps {
  label: string
  count: number
}

export const UserTableTab = React.forwardRef<
  HTMLButtonElement,
  UserTableTabProps
  // oxlint-disable-next-line react/function-component-definition -- core cleanup deferred
>(({ label, count, ...props }, ref) => {
  const tabProps = useTab({ ...props, ref })
  const isSelected = !!tabProps["aria-selected"]

  return (
    <Tab
      {...tabProps}
      textTransform="none"
      transition="all 0.2s"
      _hover={{
        borderBottomColor: isSelected ? "base.content.brand" : "gray.200",
        color: "base.content.brand",
      }}
      _selected={{
        borderBottomColor: "base.content.brand",
        color: "base.content.brand",
      }}
      _focus={{
        boxShadow: "none",
        outline: "none",
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
