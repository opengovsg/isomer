"use client"

import type { Node } from "interweave"
import { Interweave } from "interweave"

import type { BaseParagraphProps } from "~/interfaces/native/Paragraph"
import { twMerge } from "~/lib/twMerge"
import { isExternalUrl } from "~/utils"
import { Link } from "../Link"

export const BaseParagraph = ({
  content,
  className,
  id,
  LinkComponent,
}: BaseParagraphProps) => {
  const transform = (node: HTMLElement, children: Node[]): React.ReactNode => {
    if (node.tagName === "A") {
      const href = node.getAttribute("href") ?? undefined
      const isExternalLink = href && isExternalUrl(href)

      return (
        <Link
          LinkComponent={LinkComponent}
          href={href}
          rel={isExternalLink ? "noopener nofollow" : undefined}
          target={isExternalLink ? "_blank" : undefined}
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
