import { type ArticlePageSchemaType } from "~/types"
import { getBreadcrumbFromSiteMap } from "~/utils/getBreadcrumbFromSiteMap"
import { getIndexByPermalink } from "~/utils/getIndexByPermalink"

import { ArticlePageHeader } from "../../components/internal/ArticlePageHeader"
import { BackToTopLink } from "../../components/internal/BackToTopLink"
import { renderPageContent } from "../../render"
import { getCategoryFromTagged } from "../Collection/utils/getCategoryFromTagged"
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

  // NOTE: Excludes the last tagCategories group, since it's already shown
  // separately via `resolvedCategory` below
  const resolvedTags =
    tagged && parentTagCategories
      ? getTagsFromTagged(tagged, parentTagCategories.slice(0, -1))
      : tags

  const resolvedCategory = getCategoryFromTagged(tagged, parentTagCategories)

  return (
    <Skeleton site={site} page={page} layout={layout}>
      <div className="mx-auto flex max-w-[47.8rem] flex-col gap-7 px-6 md:px-10">
        <ArticlePageHeader
          {...page.articlePageHeader}
          breadcrumb={breadcrumb}
          category={resolvedCategory}
          title={page.title}
          date={page.date}
          tags={resolvedTags}
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
