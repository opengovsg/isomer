import { Box, Icon, Text, VStack } from "@chakra-ui/react"

import type { RoleType } from "~prisma/generated/generatedEnums"
import { ROLES_ICONS, ROLES_LABELS } from "./constants"
import {
  HavePermissionContentItem,
  NoPermissionContentItem,
} from "./RoleBoxContentItem"

interface RoleBoxProps {
  value: RoleType
  isSelected: boolean
  onClick: () => void
  permissionLabels: (typeof ROLES_LABELS)[number][]
}

export const RoleBox = ({
  value,
  isSelected,
  onClick,
  permissionLabels,
}: RoleBoxProps) => {
  return (
    <Box
      border="1px solid"
      p={5}
      borderColor={isSelected ? "blue.500" : "gray.200"}
      bg={isSelected ? "blue.50" : "white"}
      borderRadius="md"
      cursor="pointer"
      textAlign="center"
      fontWeight={isSelected ? "bold" : "normal"}
      flex="1"
      onClick={onClick}
      _hover={{
        borderColor: "blue.500",
        boxShadow: "sm",
      }}
    >
      <VStack gap={2} alignItems="flex-start">
        <Icon boxSize={5} as={ROLES_ICONS[value]} />
        <Text textStyle="subhead-1">{value}</Text>
        <VStack justifyContent="flex-start" align="center" gap={1} w="100%">
          {ROLES_LABELS.map((roleLabel) => {
            return permissionLabels.includes(roleLabel) ? (
              <HavePermissionContentItem text={roleLabel} />
            ) : (
              <NoPermissionContentItem text={roleLabel} />
            )
          })}
        </VStack>
      </VStack>
    </Box>
  )
}
