import type { HeroSearchbarProps } from "~/interfaces/complex/Hero"
import { isExternalUrl } from "~/utils"
import { ImageClient } from "../../Image"
import { SearchbarContent } from "./SearchbarContent"

export const HeroSearchbar = (props: HeroSearchbarProps) => {
  const { backgroundUrl, site, title } = props

  if (backgroundUrl) {
    const backgroundSrc =
      isExternalUrl(backgroundUrl) || site.assetsBaseUrl === undefined
        ? backgroundUrl
        : `${site.assetsBaseUrl}${backgroundUrl}`
    // Stacking order (back to front): image → overlay (::before) → content.
    // Without z-index, ::before would paint first and sit behind the image. We use
    // before:z-10 so the overlay sits above the image, and z-20 on the content wrapper
    // so the search bar stays on top and remains visible/clickable.
    return (
      <section className="relative flex w-full flex-col justify-center overflow-hidden text-base-content-inverse before:absolute before:inset-0 before:z-10 before:bg-[#182236] before:opacity-80 md:min-h-80 lg:min-h-96">
        <ImageClient
          src={backgroundSrc}
          alt={title}
          width="100%"
          className="absolute inset-0 h-full w-full object-cover object-center"
          assetsBaseUrl={site.assetsBaseUrl}
          lazyLoading={false} // hero is always above the fold
          fetchPriority="high"
        />
        <div className="relative z-20">
          {/* z-20 so content stacks above the overlay (z-10) and stays visible. */}
          <SearchbarContent {...props} />
        </div>
      </section>
    )
  } else {
    return (
      <section
        className="flex w-full flex-col justify-center text-base-content-strong md:min-h-80 lg:min-h-96"
        style={{
          background:
            // Very slightly diagonal gradient going from the right-top-ish (white) to the left-bottom-ish (brand canvas color)
            "linear-gradient(275deg, #FFF 6.27%, var(--color-brand-canvas-default) 100%)",
        }}
      >
        <SearchbarContent {...props} />
      </section>
    )
  }
}
