import type { CollectionCardProps } from "~/interfaces"
import type { CollectionPageSchemaType } from "~/types"
import { getFormattedDate, isExternalUrl } from "~/utils"
import { ImageClient } from "../../complex/Image"
import { Title } from "../CollectionCard/Title" // Reusing since the logic is the same for both
import { Link } from "../Link"
import { Tag } from "../Tag"

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
  const isExternalLink = !!referenceLinkHref && isExternalUrl(referenceLinkHref)

  return (
    // NOTE: In smaller viewports, we render a border between items for easy distinguishing
    // and to do that, we add a padding on smaller viewports
    <Link
      LinkComponent={LinkComponent}
      href={referenceLinkHref}
      className="group flex flex-1 flex-col gap-3 border-b pb-5 pt-5 md:pt-0"
      isExternal={isExternalLink}
    >
      {image && (
        <div className="relative mb-3 aspect-[2/1] h-auto min-h-40 shrink-0">
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
        <p className="prose-label-md-regular shrink-0 text-base-content-subtle">
          {lastUpdated ? getFormattedDate(lastUpdated) : "-"}
        </p>
      )}
      <div className="flex flex-grow flex-col gap-3 text-base-content">
        <Title title={itemTitle} isExternalLink={isExternalLink} />
        {tags.length > 0 && (
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
