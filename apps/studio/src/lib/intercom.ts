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

export const COLLECTION_TAG_CSAT_SURVEY_ID = "65029624"

export const getFirstTagEditedTrackedStorageKey = ({
  userId,
}: {
  userId: string
}): string => `intercom_event_first_tag_edited_${userId}_tracked`

export const getCollectionTagCsatSurveyStorageKey = ({
  userId,
}: {
  userId: string
}): string => `intercom_survey_${COLLECTION_TAG_CSAT_SURVEY_ID}_${userId}_shown`

export const startCollectionTagCsatSurvey = (): void => {
  if (!env.NEXT_PUBLIC_INTERCOM_APP_ID) {
    console.log("[Intercom mock] startSurvey", COLLECTION_TAG_CSAT_SURVEY_ID)
    return
  }

  startSurvey(COLLECTION_TAG_CSAT_SURVEY_ID)
}
