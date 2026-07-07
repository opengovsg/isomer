import { type ArticlePageSchemaType } from "~/types"
import {
  resolveTagCategoryDisplay,
  TAG_CATEGORY_DISPLAY_OPTIONS,
} from "~/types/constants"
import { getBreadcrumbFromSiteMap } from "~/utils/getBreadcrumbFromSiteMap"
import { getIndexByPermalink } from "~/utils/getIndexByPermalink"

import { ArticlePageHeader } from "../../components/internal/ArticlePageHeader"
import { BackToTopLink } from "../../components/internal/BackToTopLink"
import { renderPageContent } from "../../render"
import { getTagsFromTagged } from "../Collection/utils/getTagsFromTagged"
import { Skeleton } from "../Skeleton"

export const ArticleLayout = ({
  site,
  page,
  layout,
  content,
}: ArticlePageSchemaType) => {
  const breadcrumb = getBreadcrumbFromSiteMap(
    site.siteMap,
    page.permalink.split("/").slice(1),
  )

  const parent = getIndexByPermalink(page.permalink, site.siteMap)
  const tagged = page.tagged
  const tags = page.tags

  const parentTagCategories =
    parent?.layout === "collection"
      ? parent.collectionPagePageProps?.tagCategories
      : undefined

  // NOTE: Only includes groups shown as pills — plaintext groups are shown
  // separately via `plaintextTags` below. Legacy rows omitting `display` default
  // to pills via `resolveTagCategoryDisplay`.
  const pillTags =
    tagged && parentTagCategories
      ? getTagsFromTagged(
          tagged,
          parentTagCategories.filter(
            ({ display }) =>
              resolveTagCategoryDisplay(display) ===
              TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
          ),
        )
      : tags

  const plaintextTags =
    tagged && parentTagCategories
      ? getTagsFromTagged(
          tagged,
          parentTagCategories.filter(
            ({ display }) =>
              resolveTagCategoryDisplay(display) ===
              TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext,
          ),
        )
      : undefined

  return (
    <Skeleton site={site} page={page} layout={layout}>
      <div className="mx-auto flex max-w-[47.8rem] flex-col gap-7 px-6 md:px-10">
        <ArticlePageHeader
          {...page.articlePageHeader}
          breadcrumb={breadcrumb}
          plaintextTags={plaintextTags}
          title={page.title}
          date={page.date}
          pillTags={pillTags}
        />

        <div className="mx-auto w-full gap-10 pb-20">
          <div className="w-full overflow-x-auto break-words lg:max-w-[660px]">
            {renderPageContent({
              site,
              layout,
              content,
              permalink: page.permalink,
            })}
          </div>
          <BackToTopLink />
        </div>
      </div>
    </Skeleton>
  )
}
