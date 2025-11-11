import type { HeroProps } from "~/interfaces/complex/Hero"
import { SearchbarContent } from "./common/SearchbarContent"

export const HeroSearchbar = (props: HeroProps) => {
  return (
    <section
      className="flex w-full flex-col justify-center md:min-h-80 lg:min-h-96"
      style={{
        background:
          "linear-gradient(275deg, #FFF 6.27%, var(--color-brand-canvas-default) 100%)",
      }}
    >
      <SearchbarContent {...props} />
    </section>
  )
}
