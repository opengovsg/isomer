import type { ScriptComponentType } from "~/types"

export interface GoogleTagManagerHeaderProps {
  siteGtmId: string | undefined
  ScriptComponent?: ScriptComponentType
}

export interface GoogleTagManagerBodyProps {
  siteGtmId: string | undefined
}
