"use client"

import { Text } from "react-aria-components"

import type { CollectionCardProps as CollectionCardPropsInterface } from "~/interfaces"
import type { CollectionPageSchemaType } from "~/types"
import { tv } from "~/lib/tv"
import { focusVisibleHighlight, getFormattedDate } from "~/utils"
import { ImageClient } from "../../complex/Image"
import { Link } from "../Link"

// NOTE: This is client-side rendering and we want as much pre-processing
// on the server as possible to improve performance + reduce file and bandwidth size
// Thus, only the necessary props are passed to this component.
type CollectionCardProps = Pick<
  CollectionCardPropsInterface,
  "lastUpdated" | "category" | "title" | "description" | "image"
> & {
  referenceLinkHref: string | undefined
  imageSrc: string | undefined
  itemTitle: string
}
// NOTE: This is to ensure no additional props are being passed to this component
export type ProcessedCollectionCardProps = CollectionCardProps &
  Record<string, never>

const collectionCardLinkStyle = tv({
  extend: focusVisibleHighlight,
  base: "prose-title-md-semibold line-clamp-3 w-fit underline-offset-4 hover:underline",
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
}: CollectionCardProps & {
  shouldShowDate?: boolean
  siteAssetsBaseUrl: string | undefined
  LinkComponent: CollectionPageSchemaType["LinkComponent"]
}): JSX.Element => {
  return (
    <div className="flex border-collapse flex-col gap-3 border-b border-divider-medium py-5 first:border-t lg:flex-row lg:gap-6">
      {shouldShowDate && (
        <Text className="prose-label-md-regular shrink-0 text-base-content-subtle lg:w-[140px]">
          {lastUpdated ? getFormattedDate(lastUpdated) : "-"}
        </Text>
      )}
      <div className="flex flex-grow flex-col gap-3 text-base-content lg:gap-2">
        <h3 className="inline-block">
          <Link
            LinkComponent={LinkComponent}
            href={referenceLinkHref}
            className={collectionCardLinkStyle()}
          >
            <span title={itemTitle}>{itemTitle}</span>
          </Link>
        </h3>
        {description && (
          <Text className="prose-body-base line-clamp-3" title={description}>
            {description}
          </Text>
        )}
        {/* TODO: Feature enhancement? Filter by category when clicked */}
        <Text className="prose-label-md mt-3 text-base-content-subtle lg:mt-2">
          {category}
        </Text>
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
    </div>
  )
}
