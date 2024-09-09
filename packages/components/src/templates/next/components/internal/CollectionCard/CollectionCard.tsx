"use client"

import { composeRenderProps, Text } from "react-aria-components"

import type { CollectionCardProps as BaseCollectionCardProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { focusVisibleHighlight } from "~/utils/rac"
import { Link } from "../Link"

type CollectionCardProps = BaseCollectionCardProps

const collectionCardLinkStyle = tv({
  extend: focusVisibleHighlight,
  base: "prose-title-md-semibold line-clamp-2 w-fit underline-offset-4 hover:underline",
})

export const CollectionCard = ({
  LinkComponent,
  url,
  lastUpdated,
  title,
  description,
  category,
  image,
  ...props
}: CollectionCardProps): JSX.Element => {
  const file = props.variant === "file" ? props.fileDetails : null
  const itemTitle = `${file ? `[${file.type.toUpperCase()}, ${file.size}] ` : ""}${title}`
  return (
    <div className="flex border-collapse flex-col gap-3 border-b border-divider-medium py-5 first:border-t lg:flex-row lg:gap-6">
      {lastUpdated && (
        <Text className="prose-label-md-regular shrink-0 text-base-content-subtle lg:w-[140px]">
          {lastUpdated}
        </Text>
      )}
      <div className="flex flex-col gap-3 text-base-content lg:gap-2">
        <h3 className="inline-block">
          <Link
            LinkComponent={LinkComponent}
            href={url}
            className={composeRenderProps("", (className, renderProps) =>
              collectionCardLinkStyle({
                className,
                ...renderProps,
              }),
            )}
          >
            <span title={itemTitle}>{itemTitle}</span>
          </Link>
        </h3>
        <Text className="prose-body-base line-clamp-2" title={description}>
          {description}
        </Text>
        {/* TODO: Feature enhancement? Filter by category when clicked */}
        <Text className="prose-label-md mt-3 text-base-content-subtle lg:mt-2">
          {category}
        </Text>
      </div>
      {image && (
        <div className="relative mt-3 h-[140px] w-full shrink-0 lg:ml-4 lg:mt-0 lg:h-auto lg:w-[320px]">
          <img
            className="absolute left-0 h-full w-full rounded object-cover"
            src={image.src}
            alt={image.alt}
          />
        </div>
      )}
    </div>
  )
}
