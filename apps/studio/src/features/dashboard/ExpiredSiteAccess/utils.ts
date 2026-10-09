import { ISOMER_SUPPORT_EMAIL } from "~/constants/misc"

const getEmailLocalPart = (email: string) => email.split("@")[0] ?? email

export const formatAdminDisplayName = (email: string): string => {
  const local = getEmailLocalPart(email)
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")
}

export const getAdminInitials = (email: string): string => {
  const parts = getEmailLocalPart(email)
    .split(/[._-]+/)
    .filter(Boolean)
  const [first, second] = parts
  if (first !== undefined && second !== undefined) {
    return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase()
  }
  const local = parts[0] ?? email
  return local.slice(0, 2).toUpperCase()
}

export const buildExpiredSiteSupportMailto = ({
  siteName,
  loginEmail,
}: {
  siteName: string
  loginEmail: string
}) => {
  const subject = `Request access back to ${siteName}`
  const body = [
    "Hi Isomer team,",
    "",
    `My access to ${siteName} has expired. Please help me get access back.`,
    "",
    `Site: ${siteName}`,
    `Login email: ${loginEmail}`,
    "",
    "Thank you.",
  ].join("\n")

  return `mailto:${ISOMER_SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
