import type { User } from "~prisma/generated/generatedTypes"

export type isUserOnboardedProps = Pick<User, "name" | "phone">

// NOTE: Singapore phone numbers are 8 digits
// This is a hackish way to check if the phone number is a singapore phone number
// At current stage, we don't do 2FA to validate if it's a valid phone number too
// Not including +65 since OGPDS is not using it too
const isSingaporePhoneNumber = (phone: string) => {
  return (
    !isNaN(Number(phone)) &&
    phone.length === 8 &&
    (phone.startsWith("6") || phone.startsWith("8") || phone.startsWith("9"))
  )
}

export const isUserOnboarded = ({ name, phone }: isUserOnboardedProps) => {
  if (!name || !phone) {
    return false
  }

  if (!isSingaporePhoneNumber(phone)) {
    return false
  }

  return true
}
