import type {
  GoogleAnalyticsComponentType,
  IsomerSiteProps,
  ScriptComponentType,
} from "~/types"

export interface GoogleAnalyticsScriptProps {
  gaId: NonNullable<IsomerSiteProps["isomerGaId"]>
  ScriptComponent?: ScriptComponentType
  GoogleAnalyticsComponent?: GoogleAnalyticsComponentType
}
