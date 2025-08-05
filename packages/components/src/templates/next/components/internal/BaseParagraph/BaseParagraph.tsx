import type { Node } from "interweave"
import { Interweave } from "interweave"

import type { BaseParagraphProps } from "~/interfaces/native/Paragraph"
import { twMerge } from "~/lib/twMerge"
import { getReferenceLinkHref, isExternalUrl } from "~/utils"
import { Link } from "../Link"

// This will be tree-shaken out of client bundles
if (typeof window === "undefined") {
  // NOTE: We need this polyfill as interweave uses a DOM to perform the
  // conversion of HTML to React components
  void import("interweave-ssr").then(({ polyfill }) => {
    polyfill()
  })
}

export const BaseParagraph = ({
  content,
  className,
  attrs,
  id,
  site,
  LinkComponent,
}: Omit<BaseParagraphProps, "type">) => {
  const transform = (node: HTMLElement, children: Node[]): React.ReactNode => {
    if (node.tagName === "A") {
      const href = node.getAttribute("href") ?? undefined
      const isExternalLink = !!href && isExternalUrl(href)

      return (
        <Link
          LinkComponent={LinkComponent}
          href={getReferenceLinkHref(href, site.siteMap, site.assetsBaseUrl)}
          isExternal={isExternalLink}
          isWithFocusVisibleHighlight
        >
          {children}
        </Link>
      )
    }
  }

  const isAttributesPresent = !!id
  const isContentEmpty = content.trim() === ""

  return (
    <Interweave
      className={twMerge(
        `[&:not(:first-child)]:mt-6 [&:not(:last-child)]:mb-6 after:[&_a[target*="blank"]]:content-['_↗'] [&_a]:text-link [&_a]:underline [&_a]:outline-none visited:[&_a]:text-link-visited hover:[&_a]:text-link-hover focus-visible:[&_a]:bg-utility-highlight focus-visible:[&_a]:text-base-content-strong focus-visible:[&_a]:decoration-transparent focus-visible:[&_a]:shadow-focus-visible focus-visible:[&_a]:transition-none`,
        className,
      )}
      content={isContentEmpty ? "<br />" : content}
      transform={transform}
      tagName="p"
      attributes={{
        ...(isAttributesPresent && { id }),
        ...(attrs?.dir && { dir: attrs.dir }),
      }}
    />
  )
}

export default BaseParagraph
