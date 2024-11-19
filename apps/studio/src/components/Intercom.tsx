import Intercom from "@intercom/messenger-js-sdk"

import { env } from "~/env.mjs"

export const initIntercom = () => {
  // Initialize Intercom
  if (env.NEXT_PUBLIC_INTERCOM_APP_ID) {
    Intercom({
      app_id: env.NEXT_PUBLIC_INTERCOM_APP_ID,
    })
  }
}
