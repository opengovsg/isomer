import type { User } from "~prisma/generated/generatedTypes"
import { isSingaporePhoneNumber } from "~/utils/phone"

export type isUserOnboardedProps = Pick<User, "name" | "phone">

export const isUserOnboarded = ({ name, phone }: isUserOnboardedProps) => {
  if (!name || !phone) {
    return false
  }

  if (!isSingaporePhoneNumber(phone)) {
    return false
  }

  return true
}
