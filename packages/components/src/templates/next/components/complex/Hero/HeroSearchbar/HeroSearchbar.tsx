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
    // Stacking (back to front): background image (no z-index) → overlay (before:z-10) → content (z-20).
    return (
      <section className="relative flex w-full flex-col justify-center text-base-content-inverse before:absolute before:inset-0 before:z-10 before:bg-[#182236] before:opacity-80 md:min-h-80 lg:min-h-96">
        <div
          className="absolute inset-0 min-h-80 min-w-full overflow-hidden lg:min-h-96"
          style={{ contain: "layout" }}
          aria-hidden
        >
          <ImageClient
            src={backgroundSrc}
            alt={title}
            width="100%"
            className="absolute inset-0 h-full w-full object-cover object-center"
            assetsBaseUrl={site.assetsBaseUrl}
            lazyLoading={false} // hero is always above the fold
            fetchPriority="high"
          />
        </div>
        <div className="relative z-20">
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
