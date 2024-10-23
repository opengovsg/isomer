import type { Node } from "interweave"
import { Interweave } from "interweave"
import { polyfill } from "interweave-ssr"

import type { BaseParagraphProps } from "~/interfaces/native/Paragraph"
import { twMerge } from "~/lib/twMerge"
import { getReferenceLinkHref, isExternalUrl } from "~/utils"
import { Link } from "../Link"

// NOTE: We need this polyfill as interweave uses a DOM to perform the
// conversion of HTML to React components
polyfill()

export const BaseParagraph = ({
  content,
  className,
  id,
  site,
  LinkComponent,
}: Omit<BaseParagraphProps, "type">) => {
  const transform = (node: HTMLElement, children: Node[]): React.ReactNode => {
    if (node.tagName === "a") {
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

  return (
    <Interweave
      className={twMerge(
        `hover:[&_a]text-link-hover [&:not(:first-child)]:mt-6 [&:not(:last-child)]:mb-6 after:[&_a[target*="blank"]]:content-['_↗'] [&_a]:text-link [&_a]:underline [&_a]:outline-none focus-visible:[&_a]:bg-utility-highlight focus-visible:[&_a]:text-base-content-strong focus-visible:[&_a]:decoration-transparent focus-visible:[&_a]:shadow-focus-visible focus-visible:[&_a]:transition-none`,
        className,
      )}
      content={content}
      transform={transform}
      tagName="p"
      attributes={isAttributesPresent ? { id } : undefined}
    />
  )
}

export default BaseParagraph
