import type { RoleType } from "~prisma/generated/generatedEnums"

export interface UpdateUserModalState {
  siteId: number
  userId: string
  email: string
  role: (typeof RoleType)[keyof typeof RoleType]
}
