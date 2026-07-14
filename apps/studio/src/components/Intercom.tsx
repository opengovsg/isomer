import { useCallback } from "react"
import { useMe } from "~/features/me/api"
import { bootIntercom } from "~/lib/intercom"

const convertDateToUnixTimestamp = (date: Date): number => {
  return Math.floor(date.getTime() / 1000)
}

export const Intercom = () => {
  const { me } = useMe()

  const getIntercomName = useCallback(() => {
    return me.name || me.email.split("@")[0]
  }, [me])

  bootIntercom({
    user_id: me.id,
    name: getIntercomName(),
    email: me.email,
    created_at: convertDateToUnixTimestamp(me.createdAt),
  })

  return <></>
}
