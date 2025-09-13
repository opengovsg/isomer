import type { IsomerSiteProps, ScriptComponentType } from "~/types"

interface GoogleTagManagerScriptProps {
  gtmId: string
}

export interface GoogleTagManagerHeaderScriptProps
  extends GoogleTagManagerScriptProps,
    Pick<IsomerSiteProps, "usePartytown"> {
  ScriptComponent?: ScriptComponentType
}

export type GoogleTagManagerBodyScriptProps = GoogleTagManagerScriptProps

interface GoogleTagManagerProps {
  siteGtmId?: GoogleTagManagerScriptProps["gtmId"]
  isomerGtmId?: GoogleTagManagerScriptProps["gtmId"]
}

export interface GoogleTagManagerHeaderProps
  extends GoogleTagManagerProps,
    Pick<IsomerSiteProps, "usePartytown"> {
  ScriptComponent?: ScriptComponentType
}

export type GoogleTagManagerBodyProps = GoogleTagManagerProps
