import type { MapProps } from "~/interfaces"
import { isValidMapEmbedUrl } from "~/utils/validation"
import { ComponentContent } from "../../internal/customCssClass"

export const Map = ({ title, url }: MapProps) => {
  if (!isValidMapEmbedUrl(url)) {
    return <></>
  }

  return (
    <section className={`${ComponentContent} mt-7 first:mt-0`}>
      {/* NOTE: 75% is a 4:3 aspect ratio */}
      <div className="relative w-full overflow-hidden pt-[75%]">
        <iframe
          height="100%"
          width="100%"
          className="absolute bottom-0 left-0 right-0 top-0 border-0"
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
