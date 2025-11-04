import type { Except } from "type-fest"

import type {
  GoogleTagManagerComponentType,
  IsomerSiteProps,
  ScriptComponentType,
} from "~/types"
import {
  AskgovWidget,
  CloudflareZaraz,
  FontPreload,
  GoogleTagManagerBody,
  GoogleTagManagerHeader,
  GoogleTagManagerPreload,
  MicrosoftClarity,
  VicaStylesheet,
  VicaWidget,
  Wogaa,
} from "../templates/next/components/internal"

interface RenderApplicationScriptsProps {
  site: Except<IsomerSiteProps, "lastUpdated" | "navbar" | "footerItems">
  ScriptComponent: ScriptComponentType
  GoogleTagManagerComponent: GoogleTagManagerComponentType
}

export const RenderApplicationScripts = ({
  site,
  ScriptComponent,
  GoogleTagManagerComponent,
}: RenderApplicationScriptsProps) => {
  return (
    <>
      <FontPreload />

      {/* NOTE: we load in wogaa regardless of whether the site is  */}
      {/* a government site as wogaa still requires the agency to register their site */}
      {/* and wogaa is still gated behind techpass login. */}
      {/* Additionally, wogaa will still load but not track metrics if the site  */}
      {/* is not registered, so no end impact to user */}
      <Wogaa environment={site.environment} ScriptComponent={ScriptComponent} />

      {(!!site.siteGtmId || !!site.isomerGtmId) && (
        <>
          <GoogleTagManagerPreload />
          <GoogleTagManagerHeader
            siteGtmId={site.siteGtmId}
            isomerGtmId={site.isomerGtmId}
            ScriptComponent={ScriptComponent}
            GoogleTagManagerComponent={GoogleTagManagerComponent}
          />
          <GoogleTagManagerBody
            siteGtmId={site.siteGtmId}
            isomerGtmId={site.isomerGtmId}
          />
        </>
      )}

      {!!site.isomerMsClarityId && (
        <MicrosoftClarity
          ScriptComponent={ScriptComponent}
          msClarityId={site.isomerMsClarityId}
        />
      )}

      {!!site.isomerCfZarazBaseUrl && (
        <CloudflareZaraz
          ScriptComponent={ScriptComponent}
          baseUrl={site.isomerCfZarazBaseUrl}
        />
      )}

      {/* Ensures that the webchat widget only loads after the page has loaded */}
      {/* Note: did not account for both being added to the config as it's a very unlikely scenario and there's "correct" way to handle this */}
      {site.vica && (
        <>
          <VicaStylesheet useDevStagingScript={site.vica.useDevStagingScript} />
          <VicaWidget
            site={site}
            ScriptComponent={ScriptComponent}
            {...site.vica}
          />
        </>
      )}
      {site.askgov && (
        <AskgovWidget
          environment={site.environment}
          ScriptComponent={ScriptComponent}
          {...site.askgov}
        />
      )}
    </>
  )
}
