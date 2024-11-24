import type { ScriptComponentType } from "~/types"

export interface GoogleTagManagerHeaderScriptProps {
  gtmId: string
  ScriptComponent?: ScriptComponentType
}

export interface GoogleTagManagerHeaderProps {
  siteGtmId: string | undefined
  isomerGtmId: string | undefined
  ScriptComponent?: ScriptComponentType
}

export interface GoogleTagManagerBodyScriptProps {
  gtmId: string
}

export interface GoogleTagManagerBodyProps {
  siteGtmId: string | undefined
  isomerGtmId: string | undefined
}
