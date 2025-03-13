import type { User } from "~prisma/generated/generatedTypes"

export type isUserOnboardedProps = Pick<User, "name" | "phone">

// NOTE: Singapore phone numbers are 8 digits
// This is a hackish way to check if the phone number is a singapore phone number
// At current stage, we don't do 2FA to validate if it's a valid phone number too
// Not including +65 since OGPDS is not using it too
const isSingaporePhoneNumber = (phone: string) => {
  // Return false if phone is null, undefined, or not a string
  if (!phone || typeof phone !== "string") {
    return false
  }

  // Check if it's exactly 8 digits with valid starting number
  // This also checks if it contains any whitespace
  return /^[689]\d{7}$/.test(phone)
}

export const isUserOnboarded = ({ name, phone }: isUserOnboardedProps) => {
  return !!name && !!phone && isSingaporePhoneNumber(phone)
}
