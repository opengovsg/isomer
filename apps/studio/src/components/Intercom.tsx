import { Intercom as IntercomSDK } from "@intercom/messenger-js-sdk"

import { env } from "~/env.mjs"
import { useMe } from "~/features/me/api"

const convertDateToUnixTimestamp = (date: Date): number => {
  return Math.floor(date.getTime() / 1000)
}

export const Intercom = () => {
  const { me } = useMe()

  if (env.NEXT_PUBLIC_INTERCOM_APP_ID) {
    IntercomSDK({
      app_id: env.NEXT_PUBLIC_INTERCOM_APP_ID,
      user_id: me.id,
      name: me.name,
      email: me.email,
      created_at: convertDateToUnixTimestamp(me.createdAt),
    })
  }

  return <></>
}
