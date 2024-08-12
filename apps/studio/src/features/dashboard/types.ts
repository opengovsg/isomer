import { UseDisclosureReturn } from "@chakra-ui/react"
import { ResourceType } from "~prisma/generated/generatedEnums"

export interface DeleteResourceModalState {
  isOpen?: UseDisclosureReturn["isOpen"]
  title: string
  resourceId: string
  resourceType: ResourceType
}
