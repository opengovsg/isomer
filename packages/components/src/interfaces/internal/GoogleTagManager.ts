import type {
  GoogleTagManagerComponentType,
  ScriptComponentType,
} from "~/types"

interface GoogleTagManagerScriptProps {
  gtmId: string
}

export interface GoogleTagManagerHeaderScriptProps
  extends GoogleTagManagerScriptProps {
  ScriptComponent?: ScriptComponentType
  GoogleTagManagerComponent?: GoogleTagManagerComponentType
}

export type GoogleTagManagerBodyScriptProps = GoogleTagManagerScriptProps

interface GoogleTagManagerProps {
  siteGtmId?: GoogleTagManagerScriptProps["gtmId"]
  isomerGtmId?: GoogleTagManagerScriptProps["gtmId"]
}

export interface GoogleTagManagerHeaderProps extends GoogleTagManagerProps {
  ScriptComponent?: ScriptComponentType
  GoogleTagManagerComponent?: GoogleTagManagerComponentType
}

export type GoogleTagManagerBodyProps = GoogleTagManagerProps
