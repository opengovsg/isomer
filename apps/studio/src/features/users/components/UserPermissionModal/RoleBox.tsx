import type { RoleType } from "~prisma/generated/generatedEnums"
import { Icon, Text, VStack } from "@chakra-ui/react"
import { dataAttr } from "@chakra-ui/utils"
import { Button } from "@opengovsg/oui"

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
      isDisabled={isDisabled}
      onPress={onClick}
      data-selected={dataAttr(isSelected)}
      aria-label={`${value} role`}
      className="data-[selected]:bg-interaction-muted-main-active hover:bg-interaction-muted-main-hover data-[selected]:hover:bg-interaction-muted-main-active disabled:border-interaction-support-disabled disabled:bg-interaction-support-disabled disabled:text-interaction-support-disabled-content flex h-auto flex-1 flex-col rounded-md border-[1.5px] border-solid border-gray-200 bg-white p-5 text-center font-normal data-[selected]:border-base-divider-brand data-[selected]:font-bold hover:border-base-divider-medium data-[selected]:hover:border-base-divider-brand disabled:cursor-not-allowed disabled:opacity-60"
    >
      <VStack gap={2} alignItems="flex-start">
        <Icon
          boxSize={5}
          as={ROLES_ICONS[value]}
          color={
            isDisabled
              ? "interaction.support.disabled-content"
              : isSelected
                ? "base.divider.brand"
                : undefined
          }
        />
        <Text
          textStyle="subhead-1"
          color={
            isDisabled
              ? "interaction.support.disabled-content"
              : isSelected
                ? "base.divider.brand"
                : undefined
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
