// oxlint-disable-next-line no-restricted-imports
import {
  Intercom as bootIntercomSdk,
  startSurvey,
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

interface TriggerSurveyOnceProps {
  surveyId: string
  userId: string
}

const triggerSurveyOnce = ({
  surveyId,
  userId,
}: TriggerSurveyOnceProps): void => {
  const key = `intercom_survey_${surveyId}_${userId}_shown`
  if (localStorage.getItem(key)) return

  if (!env.NEXT_PUBLIC_INTERCOM_APP_ID) {
    console.log("[Intercom mock] startSurvey", surveyId)
  } else {
    startSurvey(surveyId)
  }
  localStorage.setItem(key, "1")
}

export const triggerCollectionTagCsatSurveyOnce = ({
  userId,
}: Omit<TriggerSurveyOnceProps, "surveyId">): void => {
  triggerSurveyOnce({ surveyId: "65029624", userId })
}
