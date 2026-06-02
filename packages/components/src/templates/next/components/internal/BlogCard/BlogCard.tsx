import type { CollectionCardProps } from "~/interfaces"
import type { CollectionPageSchemaType } from "~/types"
import { isExternalUrl } from "~/utils/isExternalUrl"

import { Title } from "../CollectionCard/Title" // Reusing since the logic is the same for both
import { ImageClient } from "../ImageClient"
import { Link } from "../Link"
import { Tag } from "../Tag"

export const BlogCard = ({
  description,
  category,
  image,
  isContainNeeded,
  referenceLinkHref,
  imageSrc,
  itemTitle,
  siteAssetsBaseUrl,
  shouldShowDate = true,
  tags = [],
  formattedDate,
}: CollectionCardProps & {
  shouldShowDate?: boolean
  siteAssetsBaseUrl: string | undefined
}): JSX.Element => {
  const isExternalLink = !!referenceLinkHref && isExternalUrl(referenceLinkHref)

  return (
    // NOTE: In smaller viewports, we render a border between items for easy distinguishing
    // and to do that, we add a padding on smaller viewports
    <Link
      href={referenceLinkHref}
      className="group flex flex-1 flex-col gap-3 border-b pt-5 pb-5 md:pt-0"
      isExternal={isExternalLink}
    >
      {image && (
        <div className="relative mb-3 flex aspect-2/1 h-auto min-h-40 shrink-0 items-center justify-center">
          {
            <ImageClient
              src={imageSrc || ""}
              alt={image.alt}
              width="100%"
              className={`absolute left-0 h-full w-full rounded-sm ${isContainNeeded ? "object-contain" : "object-cover"}`}
              assetsBaseUrl={siteAssetsBaseUrl}
            />
          }
        </div>
      )}
      {shouldShowDate && (
        <p className="prose-label-md-regular text-base-content-subtle shrink-0">
          {formattedDate ? formattedDate : "-"}
        </p>
      )}
      <div className="text-base-content flex flex-grow flex-col gap-3">
        <Title title={itemTitle} isExternalLink={isExternalLink} />
        {tags && tags.length > 0 && (
          <div className="-mt-1 flex flex-col gap-2">
            {tags.flatMap(({ category, selected: labels }) => {
              return (
                <div className="flex w-full flex-wrap items-center gap-1.5">
                  <p className="prose-label-sm">{category}</p>
                  {labels.map((label) => {
                    return <Tag>{label}</Tag>
                  })}
                </div>
              )
            })}
          </div>
        )}
        {description && description.trim() !== "" && (
          <p className="prose-body-base line-clamp-3 whitespace-pre-wrap">
            {description}
          </p>
        )}
        {/* TODO: Feature enhancement? Filter by category when clicked */}
        <p className="prose-label-sm-medium text-base-content-subtle">
          {category}
        </p>
      </div>
    </Link>
  )
}
