import { useMemo } from "react"
import { ISOMER_ADMINS, ISOMER_MIGRATORS } from "~prisma/constants"

import { useMe } from "~/features/me/api"

export const isIsomerAdmin = (email: string): boolean => {
  const [username = "", domain = ""] = email.split("@")
  return (
    domain === "open.gov.sg" &&
    (ISOMER_ADMINS.includes(username) || ISOMER_MIGRATORS.includes(username))
  )
}

export const useIsIsomerAdmin = (): boolean => {
  const {
    me: { email },
  } = useMe()

  return useMemo(() => isIsomerAdmin(email), [email])
}
