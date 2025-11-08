import type { MastheadProps } from "~/interfaces"
import { MastheadClient } from "./MastheadClient"
import { getMastheadButtonClassNames } from "./styles"

/**
 * Masthead component that displays government website identification information.
 */
export const Masthead = (props: Omit<MastheadProps, "type">) => {
  // Compute on server so tv/twMerge are not bundled on the client
  const mobileButtonClassNames = getMastheadButtonClassNames({
    baseClassName:
      "group flex w-full gap-1 text-start leading-5 outline-none lg:hidden",
  })
  const desktopButtonClassNames = getMastheadButtonClassNames({
    baseClassName:
      "hidden flex-row items-center text-link underline underline-offset-4 outline-0 transition-colors hover:text-link-hover focus-visible:text-content-strong lg:flex",
  })

  return (
    <MastheadClient
      {...props}
      mobileButtonClassNames={mobileButtonClassNames}
      desktopButtonClassNames={desktopButtonClassNames}
    />
  )
}

export default Masthead
