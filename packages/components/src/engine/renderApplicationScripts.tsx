import type { IsomerSiteProps, ScriptComponentType } from "~/types"
import { AskgovWidget } from "../templates/next/components/internal/Askgov"
import {
  GoogleTagManagerBody,
  GoogleTagManagerHeader,
  GoogleTagManagerPreload,
} from "../templates/next/components/internal/GoogleTagManager"
import { MicrosoftClarity } from "../templates/next/components/internal/MicrosoftClarity"
import {
  VicaStylesheet,
  VicaWidget,
} from "../templates/next/components/internal/Vica"

interface RenderApplicationScriptsProps {
  site: Omit<IsomerSiteProps, "lastUpdated" | "navbar" | "footerItems">
  ScriptComponent: ScriptComponentType
}

export const RenderApplicationScripts = ({
  site,
  ScriptComponent,
}: RenderApplicationScriptsProps) => {
  return (
    <>
      {!!site.siteGtmId && (
        <>
          <GoogleTagManagerPreload />

          <GoogleTagManagerHeader
            siteGtmId={site.siteGtmId}
            ScriptComponent={ScriptComponent}
          />
          <GoogleTagManagerBody siteGtmId={site.siteGtmId} />

          <GoogleTagManagerHeader
            siteGtmId="GTM-PQ2BGPVQ"
            ScriptComponent={ScriptComponent}
            usePartytown={true}
          />
          <GoogleTagManagerBody siteGtmId="GTM-PQ2BGPVQ" />
        </>
      )}

      {!!site.isomerMsClarityId && (
        <MicrosoftClarity msClarityId={site.isomerMsClarityId} />
      )}

      {/* Ensures that the webchat widget only loads after the page has loaded */}
      {/* Note: did not account for both being added to the config as it's a very unlikely scenario and there's "correct" way to handle this */}
      {site.vica && (
        <>
          <VicaStylesheet useDevStagingScript={site.vica.useDevStagingScript} />
          <VicaWidget site={site} {...site.vica} />
        </>
      )}
      {site.askgov && (
        <AskgovWidget environment={site.environment} {...site.askgov} />
      )}
    </>
  )
}
