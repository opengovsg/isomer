import { Badge, Tab, Text } from "@chakra-ui/react"

interface UserTableTabProps {
  label: string
  count: number
}

export const UserTableTab = ({ label, count }: UserTableTabProps) => {
  return (
    <Tab
      textTransform="none"
      _selected={{
        color: "base.content.brand",
        borderBottomColor: "base.content.brand",
        "& > .badge": {
          bg: "base.content.brand",
          color: "base.content.inverse",
        },
      }}
    >
      <Text textStyle="subhead-2">{label}</Text>
      <Badge
        className="badge"
        variant="subtle"
        colorScheme="neutral"
        size="xs"
        ml={1}
        borderRadius="full"
      >
        {count}
      </Badge>
    </Tab>
  )
}
