import { Icon, Text, VStack } from "@chakra-ui/react"
import { dataAttr } from "@chakra-ui/utils"
import { Button } from "@opengovsg/design-system-react"

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
  isDisabled?: boolean
}

export const RoleBox = ({
  value,
  isSelected,
  isDisabled = false,
  onClick,
  permissionLabels,
}: RoleBoxProps) => {
  return (
    <Button
      variant="unstyled"
      border="1px solid"
      p={5}
      borderColor={isSelected ? "blue.500" : "gray.200"}
      bg={isSelected ? "blue.50" : "white"}
      borderRadius="md"
      textAlign="center"
      fontWeight={isSelected ? "bold" : "normal"}
      flex="1"
      height="auto"
      isDisabled={isDisabled}
      onClick={onClick}
      data-selected={dataAttr(isSelected)}
      _selected={{
        borderColor: "blue.500",
        bg: "blue.50",
      }}
      _disabled={{
        color: "interaction.support.disabled-content",
        bg: "interaction.support.disabled",
        borderColor: "interaction.support.disabled",
        opacity: 0.6,
        cursor: "not-allowed",
        _hover: {
          borderColor: "gray.200",
          boxShadow: "none",
        },
      }}
      _hover={
        !isDisabled
          ? {
              borderColor: "blue.500",
              boxShadow: "sm",
            }
          : {
              bg: "interaction.support.disabled",
              borderColor: "interaction.support.disabled",
            }
      }
    >
      <VStack gap={2} alignItems="flex-start">
        <Icon
          boxSize={5}
          as={ROLES_ICONS[value]}
          color={
            isDisabled ? "interaction.support.disabled-content" : undefined
          }
        />
        <Text
          textStyle="subhead-1"
          color={
            isDisabled ? "interaction.support.disabled-content" : undefined
          }
        >
          {value}
        </Text>
        <VStack justifyContent="flex-start" align="center" gap={1} w="100%">
          {ROLES_LABELS.map((roleLabel, index) => {
            return permissionLabels.includes(roleLabel) ? (
              <HavePermissionContentItem
                key={`have-permission-${index}`}
                text={roleLabel}
                isDisabled={isDisabled}
              />
            ) : (
              <NoPermissionContentItem
                key={`no-permission-${index}`}
                text={roleLabel}
              />
            )
          })}
        </VStack>
      </VStack>
    </Button>
  )
}
