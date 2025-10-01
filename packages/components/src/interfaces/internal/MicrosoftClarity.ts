import type { IsomerSiteProps, ScriptComponentType } from "~/types"

export interface MicrosoftClarityProps {
  msClarityId: NonNullable<IsomerSiteProps["isomerMsClarityId"]>
  ScriptComponent?: ScriptComponentType
}
