import type { MapProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { isValidMapEmbedUrl, isValidOGPMapsEmbedUrl } from "~/utils/validation"
import { BaseParagraph } from "../../internal"
import { ComponentContent } from "../../internal/customCssClass"

const createMapStyles = tv({
  slots: {
    outerContainer: `${ComponentContent} mt-7 first:mt-0`,
    innerContainer: "relative w-full overflow-hidden pt-[75%]",
    iframe: "absolute bottom-0 left-0 right-0 top-0 border-0",
    paragraph: "prose-body-base text-base-content",
  },
  variants: {
    isOgpMapsEmbed: {
      true: {
        innerContainer: "min-h-[45rem] lg:min-h-0",
      },
    },
  },
})

export const Map = ({ title, url, site, LinkComponent }: MapProps) => {
  if (!isValidMapEmbedUrl(url)) {
    return <></>
  }

  const isOgpMapsEmbed = isValidOGPMapsEmbedUrl(new URL(url))

  const compoundStyles = createMapStyles({
    isOgpMapsEmbed,
  })

  return (
    <section className={compoundStyles.outerContainer()}>
      {isOgpMapsEmbed && (
        <BaseParagraph
          content={`You can also view the map below on <a href="${url}">Maps.gov.sg</a>.`}
          site={site}
          LinkComponent={LinkComponent}
        />
      )}

      {/* NOTE: 75% is a 4:3 aspect ratio */}
      <div className={compoundStyles.innerContainer()}>
        <iframe
          height="100%"
          width="100%"
          className={compoundStyles.iframe()}
          src={url}
          title={title || "Map embedded in the page"}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </section>
  )
}
