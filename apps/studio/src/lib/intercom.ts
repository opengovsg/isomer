import { startSurvey } from "@intercom/messenger-js-sdk"

const triggerSurveyOnce = ({ surveyId }: { surveyId: string }): void => {
  const key = `intercom_survey_${surveyId}_shown`
  if (!localStorage.getItem(key)) {
    startSurvey(surveyId)
    localStorage.setItem(key, "1")
  }
}

export const triggerCsatSurveyOnce = (): void => {
  triggerSurveyOnce({ surveyId: "65029624" })
}
