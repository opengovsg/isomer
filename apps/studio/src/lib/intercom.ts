// oxlint-disable-next-line no-restricted-imports
import {
  Intercom as initializeIntercomSdk,
  boot as bootIntercomSdk,
  shutdown as shutdownIntercomSdk,
  trackEvent as trackEventSdk,
  update as updateIntercomSdk,
} from "@intercom/messenger-js-sdk"
import { env } from "~/env.mjs"

type BootIntercomProps = Omit<
  Parameters<typeof initializeIntercomSdk>[0],
  "app_id"
> & { user_id: string }

let initialized = false
let activeUserId: string | undefined

export const bootIntercom = (props: BootIntercomProps): void => {
  if (!env.NEXT_PUBLIC_INTERCOM_APP_ID) {
    console.log("[Intercom mock] bootIntercom", props)
    return
  }

  if (activeUserId === props.user_id) {
    updateIntercomSdk(props)
    return
  }

  shutdownIntercom()
  const settings = { app_id: env.NEXT_PUBLIC_INTERCOM_APP_ID, ...props }
  if (initialized) {
    // The SDK initializer sends update, not boot, once its script is loaded.
    bootIntercomSdk(settings)
  } else {
    initializeIntercomSdk(settings)
    initialized = true
  }
  activeUserId = props.user_id
}

export const shutdownIntercom = (): void => {
  if (!activeUserId) return
  activeUserId = undefined
  shutdownIntercomSdk()
}

export const trackEvent = (eventName: string): void => {
  if (!env.NEXT_PUBLIC_INTERCOM_APP_ID) {
    console.log("[Intercom mock] trackEvent", eventName)
    return
  }

  if (activeUserId) trackEventSdk(eventName)
}
