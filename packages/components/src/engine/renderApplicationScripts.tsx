import type { Except } from "type-fest"

import type { IsomerSiteProps, ScriptComponentType } from "~/types"
import {
  AskgovWidget,
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
}

export const RenderApplicationScripts = ({
  site,
  ScriptComponent,
}: RenderApplicationScriptsProps) => {
  return (
    <>
      <FontPreload />

      {site.isGovernment && <Wogaa ScriptComponent={ScriptComponent} />}

      {(!!site.siteGtmId || !!site.isomerGtmId) && (
        <>
          <GoogleTagManagerPreload />
          <GoogleTagManagerHeader
            siteGtmId={site.siteGtmId}
            isomerGtmId={site.isomerGtmId}
            usePartytown={site.usePartytown}
            ScriptComponent={ScriptComponent}
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

      {/* Ensures that the webchat widget only loads after the page has loaded */}
      {/* Note: did not account for both being added to the config as it's a very unlikely scenario and there's "correct" way to handle this */}
      {site.vica && (
        <>
          <VicaStylesheet environment={site.environment} />
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
