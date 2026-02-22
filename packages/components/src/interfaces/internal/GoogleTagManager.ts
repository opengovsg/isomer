import type { IsomerSiteProps, ScriptComponentType } from "~/types"

interface GoogleTagManagerProps {
  siteGtmId: NonNullable<IsomerSiteProps["siteGtmId"]>
}

export interface GoogleTagManagerHeaderProps extends GoogleTagManagerProps {
  ScriptComponent?: ScriptComponentType
  usePartytown?: boolean
}

export type GoogleTagManagerBodyProps = GoogleTagManagerProps
