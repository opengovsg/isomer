import type { IconType } from "react-icons/lib"
import { RoleType } from "~prisma/generated/generatedEnums"
import { BiCheckShield, BiPencil, BiRocket } from "react-icons/bi"

// TODO: move this to a official isomer.gov.sg once we migrate that to Isomer Next
export const ISOMER_GUIDE_URL =
  "https://support.isomer.gov.sg/en/articles/10425945-adding-and-removing-collaborators"

export const ROLES_ICONS: Record<RoleType, IconType> = {
  [RoleType.Editor]: BiPencil,
  [RoleType.Publisher]: BiRocket,
  [RoleType.Admin]: BiCheckShield,
} as const

export const ROLES_LABELS = [
  "Edit content",
  "Publish content",
  "Manage users",
  "Change settings",
] as const

export const ROLE_CONFIGS: {
  role: RoleType
  permissionLabels: (typeof ROLES_LABELS)[number][]
}[] = [
  {
    role: RoleType.Editor,
    permissionLabels: ["Edit content"],
  },
  {
    role: RoleType.Publisher,
    permissionLabels: ["Edit content", "Publish content"],
  },
  {
    role: RoleType.Admin,
    permissionLabels: [
      "Edit content",
      "Publish content",
      "Manage users",
      "Change settings",
    ],
  },
] as const
