import type { MapProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { isValidMapEmbedUrl, isValidOGPMapsEmbedUrl } from "~/utils/validation"
import { ComponentContent } from "../../internal/customCssClass"

const createMapStyles = tv({
  slots: {
    outerContainer: `${ComponentContent} mt-7 first:mt-0`,
    innerContainer: "relative w-full overflow-hidden pt-[75%]",
    iframe: "absolute bottom-0 left-0 right-0 top-0 border-0",
  },
  variants: {
    isOgpMapsUrl: {
      true: {
        innerContainer: "min-h-[45rem]",
      },
    },
  },
})

export const Map = ({ title, url }: MapProps) => {
  if (!isValidMapEmbedUrl(url)) {
    return <></>
  }

  const isOgpMapsUrl = isValidOGPMapsEmbedUrl(new URL(url))

  const compoundStyles = createMapStyles({
    isOgpMapsUrl,
  })

  return (
    <section className={compoundStyles.outerContainer()}>
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
