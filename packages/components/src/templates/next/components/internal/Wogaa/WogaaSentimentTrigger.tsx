import type { WogaaSentimentTriggerProps } from "~/interfaces"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"
import { isSentimentAutoTriggerEligible } from "~/utils/isSentimentAutoTriggerEligible"

import { WogaaSentimentTriggerClient } from "./WogaaSentimentTriggerClient"

const SENTIMENT_TRIGGER_DELAY_MS = 60_000
const SENTIMENT_TRIGGER_SCROLL_DEPTH = 0.75

// Shows the WOGAA Sentiments pop-up on content and article pages after
// 75% scroll depth or 60 seconds, whichever comes first, once per session.
// Sites without Sentiments activated on WOGAA are unaffected, as
// `wogaaCustom.sentiments` is then unavailable and nothing is shown.
export const WogaaSentimentTrigger = ({
  site,
  layout,
  permalink,
}: WogaaSentimentTriggerProps) => {
  const { url, footerItems, siteMapArray, assetsBaseUrl } = site

  const getFooterPageHrefs = () =>
    [
      footerItems.privacyStatementLink,
      footerItems.termsOfUseLink,
      footerItems.contactUsLink,
      footerItems.feedbackFormLink,
    ].map((link) => getReferenceLinkHref(link, siteMapArray, assetsBaseUrl))

  if (
    !isSentimentAutoTriggerEligible({
      siteUrl: url,
      layout,
      permalink,
      getFooterPageHrefs,
    })
  ) {
    return null
  }

  return (
    // Keyed by permalink so timers and scroll tracking reset on client-side navigation
    <WogaaSentimentTriggerClient
      key={permalink}
      delayMs={SENTIMENT_TRIGGER_DELAY_MS}
      scrollDepthThreshold={SENTIMENT_TRIGGER_SCROLL_DEPTH}
    />
  )
}
