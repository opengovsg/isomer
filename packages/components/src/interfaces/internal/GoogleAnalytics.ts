import type { GoogleAnalyticsComponentType, ScriptComponentType } from "~/types"

export interface GoogleAnalyticsScriptProps {
  gaId: string
  ScriptComponent?: ScriptComponentType
  GoogleAnalyticsComponent?: GoogleAnalyticsComponentType
}
