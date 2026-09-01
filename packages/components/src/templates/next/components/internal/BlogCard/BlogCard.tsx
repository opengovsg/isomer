import type { CollectionCardProps } from "~/interfaces"
import { isExternalUrl } from "~/utils/isExternalUrl"

import { EventDateFilterDisplay } from "../CollectionCard/EventDateFilterDisplay"
import { Title } from "../CollectionCard/Title"
import { ImageClient } from "../ImageClient"
import { Link } from "../Link"
import { PillTags, PlaintextTags } from "../Tags"

export const BlogCard = ({
  description,
  plaintextTags,
  image,
  isContainNeeded,
  referenceLinkHref,
  imageSrc,
  itemTitle,
  siteAssetsBaseUrl,
  shouldShowDate = true,
  pillTags,
  formattedDate,
  headingLevel,
  dateFilterDisplayEntries,
}: CollectionCardProps & {
  shouldShowDate?: boolean
  siteAssetsBaseUrl: string | undefined
  headingLevel: number
}): JSX.Element => {
  const isExternalLink = !!referenceLinkHref && isExternalUrl(referenceLinkHref)

  return (
    // NOTE: In smaller viewports, we render a border between items for easy distinguishing
    // and to do that, we add a padding on smaller viewports
    <Link
      href={referenceLinkHref}
      className="group flex flex-1 flex-col gap-3 border-b pb-5 pt-5 md:pt-0"
      isExternal={isExternalLink}
    >
      {image && (
        <div className="relative mb-3 flex aspect-[2/1] h-auto min-h-40 shrink-0 items-center justify-center">
          {
            <ImageClient
              src={imageSrc || ""}
              alt={image.alt}
              width="100%"
              className={`absolute left-0 h-full w-full rounded ${isContainNeeded ? "object-contain" : "object-cover"}`}
              assetsBaseUrl={siteAssetsBaseUrl}
            />
          }
        </div>
      )}
      {shouldShowDate && (
        <p className="prose-label-md-regular shrink-0 text-base-content-subtle">
          {formattedDate ? formattedDate : "-"}
        </p>
      )}
      <div className="flex flex-grow flex-col gap-3 text-base-content">
        <EventDateFilterDisplay entries={dateFilterDisplayEntries}>
          <Title
            title={itemTitle}
            isExternalLink={isExternalLink}
            headingLevel={headingLevel}
          />
        </EventDateFilterDisplay>
        <PillTags
          tags={pillTags}
          className="flex w-full flex-wrap items-center gap-1.5"
          containerClassName="-mt-1 flex flex-col gap-2"
        />
        {description && description.trim() !== "" && (
          <p className="prose-body-base line-clamp-3 whitespace-pre-wrap">
            {description}
          </p>
        )}
        <PlaintextTags
          tags={plaintextTags}
          className="prose-label-sm-medium text-base-content-subtle"
        />
      </div>
    </Link>
  )
}
