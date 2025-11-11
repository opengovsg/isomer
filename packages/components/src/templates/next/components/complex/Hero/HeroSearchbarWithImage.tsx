import type { HeroProps } from "~/interfaces/complex/Hero"
import { isExternalUrl } from "~/utils"
import { SearchbarContent } from "./common/SearchbarContent"

export const HeroSearchbarWithImage = (props: HeroProps) => {
  const { backgroundUrl, site } = props

  const backgroundSrc =
    isExternalUrl(backgroundUrl) || site.assetsBaseUrl === undefined
      ? backgroundUrl
      : `${site.assetsBaseUrl}${backgroundUrl}`

  return (
    <section
      className="relative flex w-full flex-col justify-center before:absolute before:inset-0 before:bg-[#182236] before:opacity-80 md:min-h-80 lg:min-h-96"
      style={{
        backgroundImage: `url('${backgroundSrc}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <SearchbarContent {...props} />
    </section>
  )
}
