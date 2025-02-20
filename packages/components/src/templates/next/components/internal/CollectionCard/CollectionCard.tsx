import type { CollectionCardProps } from "~/interfaces"
import type { CollectionPageSchemaType } from "~/types"
import { tv } from "~/lib/tv"
import { focusVisibleHighlight, getFormattedDate } from "~/utils"
import { ImageClient } from "../../complex/Image"
import { Link } from "../Link"
import { Tag } from "../Tag"

const collectionCardLinkStyle = tv({
  extend: focusVisibleHighlight,
  base: "prose-title-md-semibold line-clamp-3 w-fit underline-offset-4 group-hover:underline",
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
  return (
    <Link
      LinkComponent={LinkComponent}
      href={referenceLinkHref}
      className="group border-collapse border-b border-divider-medium first:border-t"
    >
      <div className="flex flex-col gap-3 py-5 lg:flex-row lg:gap-6">
        {shouldShowDate && (
          <p className="prose-label-md-regular shrink-0 text-base-content-subtle lg:w-[140px]">
            {lastUpdated ? getFormattedDate(lastUpdated) : "-"}
          </p>
        )}
        <div className="flex flex-grow flex-col gap-3 text-base-content lg:gap-2">
          <h3 className={collectionCardLinkStyle()}>
            <span title={itemTitle}>{itemTitle}</span>
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
      </div>
    </Link>
  )
}
