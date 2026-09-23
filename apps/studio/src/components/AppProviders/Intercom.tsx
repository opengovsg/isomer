import { useRouter } from "next/router"
import { useEffect } from "react"
import { env } from "~/env.mjs"
import { useLoginState } from "~/features/auth"
import { useMe } from "~/features/me/api"
import { bootIntercom, shutdownIntercom } from "~/lib/intercom"

const convertDateToUnixTimestamp = (date: Date): number => {
  return Math.floor(date.getTime() / 1000)
}

export const Intercom = () => {
  const { hasLoginStateFlag } = useLoginState()

  if (!hasLoginStateFlag || !env.NEXT_PUBLIC_INTERCOM_APP_ID) {
    return null
  }

  return <IntercomSession />
}

const IntercomSession = () => {
  const { me } = useMe()
  const { asPath } = useRouter()

  useEffect(() => {
    bootIntercom({
      user_id: me.id,
      name: me.name || me.email.split("@")[0],
      email: me.email,
      created_at: convertDateToUnixTimestamp(me.createdAt),
      // Force a URL check even when the user's profile has not changed.
      last_request_at: Math.floor(Date.now() / 1000),
    })
  }, [me, asPath])

  useEffect(() => shutdownIntercom, [])

  return null
}
