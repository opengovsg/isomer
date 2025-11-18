import type { HeroSearchbarProps } from "~/interfaces/complex/Hero"
import { isExternalUrl } from "~/utils"
import { SearchbarContent } from "./SearchbarContent"

export const HeroSearchbar = (props: HeroSearchbarProps) => {
  const { backgroundUrl, site } = props

  if (backgroundUrl) {
    const backgroundSrc =
      isExternalUrl(backgroundUrl) || site.assetsBaseUrl === undefined
        ? backgroundUrl
        : `${site.assetsBaseUrl}${backgroundUrl}`
    return (
      <section
        className="relative flex w-full flex-col justify-center bg-cover bg-center bg-no-repeat text-base-content-inverse before:absolute before:inset-0 before:bg-[#182236] before:opacity-80 md:min-h-80 lg:min-h-96"
        style={{
          backgroundImage: `url('${backgroundSrc}')`,
        }}
      >
        <SearchbarContent {...props} />
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
