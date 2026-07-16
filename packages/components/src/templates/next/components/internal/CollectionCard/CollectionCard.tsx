import type { CollectionCardProps } from "~/interfaces"
import { isExternalUrl } from "~/utils/isExternalUrl"

import { ImageClient } from "../ImageClient"
import { Link } from "../Link"
import { PillTags, PlaintextTags } from "../Tags"
import { Title } from "./Title"

export const CollectionCard = ({
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
}: CollectionCardProps & {
  shouldShowDate?: boolean
  siteAssetsBaseUrl: string | undefined
}): JSX.Element => {
  const isExternalLink = !!referenceLinkHref && isExternalUrl(referenceLinkHref)

  return (
    <Link
      href={referenceLinkHref}
      className="group flex border-collapse flex-col gap-3 border-b border-divider-medium py-5 first:border-t md:flex-row md:gap-6"
      isExternal={isExternalLink}
    >
      {shouldShowDate && (
        <p className="prose-label-md-regular shrink-0 text-base-content-subtle md:w-[140px]">
          {formattedDate ? formattedDate : "-"}
        </p>
      )}
      <div className="flex flex-grow flex-col gap-3 text-base-content md:gap-2">
        <Title title={itemTitle} isExternalLink={isExternalLink} />
        <PillTags
          tags={pillTags}
          className="flex w-full flex-wrap items-center gap-2"
        />
        {description && description.trim() !== "" && (
          <p className="prose-body-base mb-3 line-clamp-3 whitespace-pre-wrap md:mb-2">
            {description}
          </p>
        )}
        <PlaintextTags
          tags={plaintextTags}
          className="prose-label-md text-base-content-subtle"
        />
      </div>
      {image && (
        <div className="relative mt-3 flex h-[160px] w-[200px] shrink-0 items-center justify-center md:ml-4 md:mt-0">
          <ImageClient
            src={imageSrc || ""}
            alt={image.alt}
            width="100%"
            className={`absolute left-0 h-full w-full rounded ${isContainNeeded ? "object-contain" : "object-cover"}`}
            assetsBaseUrl={siteAssetsBaseUrl}
          />
        </div>
      )}
    </Link>
  )
}
