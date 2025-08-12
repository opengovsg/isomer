import type { CollectionCardProps } from "~/interfaces"
import type { CollectionPageSchemaType } from "~/types"
import { getFormattedDate, isExternalUrl } from "~/utils"
import { ImageClient } from "../../complex/Image"
import { Link } from "../Link"
import { Tag } from "../Tag"
import { Title } from "./Title"

export const CollectionCard = ({
  LinkComponent,
  date,
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
    <Link
      LinkComponent={LinkComponent}
      href={referenceLinkHref}
      className="group flex border-collapse flex-col gap-3 border-b border-divider-medium py-5 first:border-t md:flex-row md:gap-6"
      isExternal={isExternalLink}
    >
      {shouldShowDate && (
        <p className="prose-label-md-regular shrink-0 text-base-content-subtle lg:w-[140px]">
          {date ? getFormattedDate(date.toISOString()) : "-"}
        </p>
      )}
      <div className="flex flex-grow flex-col gap-3 text-base-content md:gap-2">
        <Title title={itemTitle} isExternalLink={isExternalLink} />
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
        {description && description.trim() !== "" && (
          <p className="prose-body-base mb-3 line-clamp-3 whitespace-pre-wrap md:mb-2">
            {description}
          </p>
        )}
        {/* TODO: Feature enhancement? Filter by category when clicked */}
        <p className="prose-label-md text-base-content-subtle">{category}</p>
      </div>
      {image && (
        <div className="relative mt-3 h-[160px] w-[200px] shrink-0 md:ml-4 md:mt-0">
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
