export interface GoogleTagManagerScriptProps {
  gtmId: string
}

export interface GoogleTagManagerProps {
  siteGtmId?: GoogleTagManagerScriptProps["gtmId"]
  isomerGtmId?: GoogleTagManagerScriptProps["gtmId"]
}
