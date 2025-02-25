import { useEffect, useRef, useState } from "react"
import { BiLinkExternal } from "react-icons/bi"

import type { CollectionCardProps } from "~/interfaces"
import type { CollectionPageSchemaType } from "~/types"
import { tv } from "~/lib/tv"
import { focusVisibleHighlight, getFormattedDate, isExternalUrl } from "~/utils"
import { ImageClient } from "../../complex/Image"
import { Link } from "../Link"
import { Tag } from "../Tag"

const collectionCardLinkStyle = tv({
  extend: focusVisibleHighlight,
  base: "prose-title-md-semibold flex w-fit flex-col underline-offset-4 group-hover:underline",
})

export const CollectionCard = ({
  LinkComponent,
  lastUpdated,
  description,
  category,
  image,
  referenceLinkHref,
  imageSrc,
  itemTitle,
  siteAssetsBaseUrl,
  shouldShowDate = true,
  tags = [],
}: CollectionCardProps & {
  shouldShowDate?: boolean
  siteAssetsBaseUrl: string | undefined
  LinkComponent: CollectionPageSchemaType["LinkComponent"]
}): JSX.Element => {
  const isExternalLink = !!referenceLinkHref && isExternalUrl(referenceLinkHref)

  const textRef = useRef<HTMLSpanElement | null>(null)
  const [isTruncated, setIsTruncated] = useState(false)
  useEffect(() => {
    const checkTruncation = () => {
      const element = textRef.current
      if (!element) return

      setIsTruncated(element.scrollHeight > element.clientHeight)
    }

    checkTruncation()

    window.addEventListener("resize", checkTruncation)
    return () => window.removeEventListener("resize", checkTruncation)
  }, [itemTitle])

  return (
    <Link
      LinkComponent={LinkComponent}
      href={referenceLinkHref}
      className="group flex border-collapse flex-col gap-3 border-b border-divider-medium py-5 first:border-t lg:flex-row lg:gap-6"
      isExternal={isExternalLink}
    >
      {shouldShowDate && (
        <p className="prose-label-md-regular shrink-0 text-base-content-subtle lg:w-[140px]">
          {lastUpdated ? getFormattedDate(lastUpdated) : "-"}
        </p>
      )}
      <div className="flex flex-grow flex-col gap-3 text-base-content lg:gap-2">
        <h3 className={collectionCardLinkStyle()}>
          <span ref={textRef} className="line-clamp-3" title={itemTitle}>
            {itemTitle}
            {isExternalLink && !isTruncated && (
              <BiLinkExternal className="ml-1 inline-block h-auto w-3.5 align-middle lg:ml-1.5 lg:w-4" />
            )}
          </span>

          {/* Show icon below text if truncated */}
          {isExternalLink && isTruncated && (
            <div className="mt-1">
              <BiLinkExternal className="h-auto w-3.5 text-base-content-subtle lg:w-4" />
            </div>
          )}
        </h3>
        {tags && tags.length > 0 && (
          <>
            {tags.flatMap(({ category, selected: labels }) => {
              return (
                <div className="flex w-full flex-wrap items-center gap-2">
                  <p className="prose-label-sm">{category}</p>
                  {labels.map((label) => {
                    return <Tag>{label}</Tag>
                  })}
                </div>
              )
            })}
          </>
        )}
        {description && (
          <p className="prose-body-base line-clamp-3 whitespace-pre-wrap">
            {description}
          </p>
        )}
        {/* TODO: Feature enhancement? Filter by category when clicked */}
        <p className="prose-label-md mt-3 text-base-content-subtle lg:mt-2">
          {category}
        </p>
      </div>
      {image && (
        <div className="relative mt-3 min-h-40 w-full shrink-0 lg:ml-4 lg:mt-0 lg:h-auto lg:w-1/4">
          <ImageClient
            src={imageSrc || ""}
            alt={image.alt}
            width="100%"
            className="absolute left-0 h-full w-full rounded object-cover"
            assetsBaseUrl={siteAssetsBaseUrl}
          />
        </div>
      )}
    </Link>
  )
}
