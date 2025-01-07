"use client"

import { Text } from "react-aria-components"

import type { CollectionCardProps } from "~/interfaces"
import type { CollectionPageSchemaType } from "~/types"
import { tv } from "~/lib/tv"
import { focusVisibleHighlight, getFormattedDate } from "~/utils"
import { ImageClient } from "../../complex/Image"
import { Link } from "../Link"
import { Tag } from "../Tag"

const collectionCardLinkStyle = tv({
  extend: focusVisibleHighlight,
  base: "prose-title-md-semibold line-clamp-3 w-fit underline-offset-4 hover:underline",
})

export const BlogCard = ({
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
  return (
    // NOTE: In smaller viewports, we render a border between items for easy distinguishing
    // and to do that, we add a padding on smaller viewports
    <div className="flex flex-1 flex-col gap-3 border-b pb-5 pt-5 md:pt-0">
      {image && (
        <div className="relative mb-3 min-h-40 w-full shrink-0">
          {
            <ImageClient
              src={imageSrc || ""}
              alt={image.alt}
              width="100%"
              className="absolute left-0 h-full w-full rounded object-cover"
              assetsBaseUrl={siteAssetsBaseUrl}
            />
          }
        </div>
      )}
      {shouldShowDate && (
        <Text className="prose-label-md-regular shrink-0 text-base-content-subtle">
          {lastUpdated ? getFormattedDate(lastUpdated) : "-"}
        </Text>
      )}
      <div className="flex flex-grow flex-col gap-3 text-base-content">
        <h3 className="inline-block">
          <Link
            LinkComponent={LinkComponent}
            href={referenceLinkHref}
            className={collectionCardLinkStyle()}
          >
            <span title={itemTitle}>{itemTitle}</span>
          </Link>
        </h3>
        {tags && tags.length > 0 && (
          <div className="-mt-1 flex flex-col gap-1">
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
          </div>
        )}
        {description && (
          <Text className="prose-body-base line-clamp-3" title={description}>
            {description}
          </Text>
        )}
        {/* TODO: Feature enhancement? Filter by category when clicked */}
        <Text className="prose-label-sm-medium text-base-content-subtle">
          {category}
        </Text>
      </div>
    </div>
  )
}
