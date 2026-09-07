import { useEffect } from "react"
import { useMe } from "~/features/me/api"
import { bootIntercom } from "~/lib/intercom"

const convertDateToUnixTimestamp = (date: Date): number => 
  Math.floor(date.getTime() / 1000)


export const Intercom = () => {
  const { me } = useMe()

  useEffect(() => {
    bootIntercom({
      created_at: convertDateToUnixTimestamp(me.createdAt),
      email: me.email,
      name: me.name || me.email.split("@")[0],
      user_id: me.id,
    })
  }, [me])

  return null
}
