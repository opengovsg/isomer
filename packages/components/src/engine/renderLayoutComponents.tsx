import type { IsomerSiteProps, ScriptComponentType } from "~/types"
import {
  AskgovWidget,
  FontPreload,
  GoogleTagManagerBody,
  GoogleTagManagerHeader,
  GoogleTagManagerPreload,
  VicaStylesheet,
  VicaWidget,
  Wogaa,
} from "../templates/next/components/internal"

interface RenderApplicationScriptsProps {
  site: Omit<IsomerSiteProps, "lastUpdated" | "navbar" | "footerItems">
  ScriptComponent: ScriptComponentType
}

export const RenderApplicationScripts = ({
  site,
  ScriptComponent,
}: RenderApplicationScriptsProps) => {
  const shouldIncludeGTM =
    site.environment === "production" &&
    (!!site.siteGtmId || !!site.isomerGtmId)

  return (
    <>
      <FontPreload />

      {site.isGovernment && <Wogaa ScriptComponent={ScriptComponent} />}

      {shouldIncludeGTM && (
        <>
          <GoogleTagManagerPreload />
          <GoogleTagManagerHeader
            siteGtmId={site.siteGtmId}
            isomerGtmId={site.isomerGtmId}
            ScriptComponent={ScriptComponent}
          />
          <GoogleTagManagerBody
            siteGtmId={site.siteGtmId}
            isomerGtmId={site.isomerGtmId}
          />
        </>
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
