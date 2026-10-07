// oxlint-disable-next-line no-restricted-imports
import {
  Intercom as bootIntercomSdk,
  trackEvent as trackEventSdk,
} from "@intercom/messenger-js-sdk"
import { env } from "~/env.mjs"

type BootIntercomProps = Omit<Parameters<typeof bootIntercomSdk>[0], "app_id">

export const bootIntercom = (props: BootIntercomProps): void => {
  if (!env.NEXT_PUBLIC_INTERCOM_APP_ID) {
    console.log("[Intercom mock] bootIntercom", props)
    return
  }

  bootIntercomSdk({ app_id: env.NEXT_PUBLIC_INTERCOM_APP_ID, ...props })
}

export const trackEvent = (eventName: string): void => {
  if (!env.NEXT_PUBLIC_INTERCOM_APP_ID) {
    console.log("[Intercom mock] trackEvent", eventName)
    return
  }

  trackEventSdk(eventName)
}
