import type { ReactNode } from "react"
import Intercom from "@intercom/messenger-js-sdk"

import { env } from "~/env.mjs"

interface WithIntercomWrapperProps {
  children: ReactNode
}
export const WithIntercomWrapper = ({ children }: WithIntercomWrapperProps) => {
  if (env.NEXT_PUBLIC_INTERCOM_APP_ID) {
    Intercom({
      app_id: env.NEXT_PUBLIC_INTERCOM_APP_ID,
    })
  }

  return children
}
