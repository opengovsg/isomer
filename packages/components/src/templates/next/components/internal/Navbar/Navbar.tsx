import type { NavbarProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"

import { NavbarClient } from "./NavbarClient"

const navbarLogoStyles = tv({
  base: "object-contain object-left",
  defaultVariants: {
    variant: "default",
  },
  variants: {
    variant: {
      default: "max-h-[48px] max-w-[128px]",
      utility: "max-h-[48px] max-w-[128px] lg:max-h-[68px] lg:max-w-[180px]",
    },
  },
})

// This section is server rendered to optimize performance
// by avoiding the transfer of large sitemaps (under `site`) to the client,
// thereby reducing the overall build size.
export const Navbar = ({
  logoUrl,
  logoAlt,
  layout,
  search,
  items,
  callToAction,
  utility,
  site,
}: NavbarProps) => {
  // recursive function to process each navbar item
  const processNavItem = (
    item: NavbarProps["items"][number],
  ): NavbarProps["items"][number] => ({
    ...item,
    items: item.items?.map(processNavItem),
    url:
      getReferenceLinkHref(item.url, site.siteMapArray, site.assetsBaseUrl) ??
      item.url,
  })

  return (
    <NavbarClient
      layout={layout}
      search={search}
      items={items.map(processNavItem)}
      imageClientProps={{
        alt: logoAlt,
        assetsBaseUrl: site.assetsBaseUrl,
        className: navbarLogoStyles({
          variant: utility ? "utility" : "default",
        }),
        // will always be above the fold
        lazyLoading: false,
        src: logoUrl,
        width: "100%",
      }}
      callToAction={
        callToAction
          ? {
              isPinnedOnMobile: callToAction.isPinnedOnMobile,
              label: callToAction.label,
              url:
                getReferenceLinkHref(
                  callToAction.url,
                  site.siteMapArray,
                  site.assetsBaseUrl,
                ) ?? callToAction.url,
            }
          : undefined
      }
      utility={
        utility
          ? {
              items: utility.items.map((item) => ({
                name: item.name,
                url:
                  getReferenceLinkHref(
                    item.url,
                    site.siteMapArray,
                    site.assetsBaseUrl,
                  ) ?? item.url,
              })),
              label: utility.label,
            }
          : undefined
      }
    />
  )
}
