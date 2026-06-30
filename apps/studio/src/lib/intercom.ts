import { startSurvey } from "@intercom/messenger-js-sdk"

interface TriggerSurveyOnceProps {
  surveyId: string
  userId: string
}

const triggerSurveyOnce = ({
  surveyId,
  userId,
}: TriggerSurveyOnceProps): void => {
  const key = `intercom_survey_${surveyId}_${userId}_shown`
  if (!localStorage.getItem(key)) {
    startSurvey(surveyId)
    localStorage.setItem(key, "1")
  }
}

export const triggerCollectionTagCsatSurveyOnce = ({
  userId,
}: Omit<TriggerSurveyOnceProps, "surveyId">): void => {
  triggerSurveyOnce({ surveyId: "65029624", userId })
}
